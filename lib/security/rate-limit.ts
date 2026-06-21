/**
 * lib/security/rate-limit.ts
 *
 * AWS-native Token Bucket rate limiter backed by DynamoDB ("StreakProofs" table).
 *
 * Schema per bucket item:
 *   pk  = "RATE_LIMIT#<identifier>"   (handle for users, IP for auth routes)
 *   sk  = "BUCKET"
 *   tokens      : number  — current token count
 *   last_refill : number  — Unix timestamp (ms) of last refill
 *
 * The algorithm:
 *   1. Fetch the current bucket (or assume a full bucket for first-time callers).
 *   2. Calculate how many tokens have been re-accumulated since last_refill.
 *   3. If tokens >= 1, decrement by 1 and write back → ALLOW.
 *   4. Otherwise → DENY (rate limited).
 *
 * All writes use a conditional expression so concurrent Lambda / Edge invocations
 * do not race; if the condition fails (stale read) we treat the request as
 * rate-limited rather than retrying to keep latency predictable.
 *
 * Pre-defined limit constants are exported so route handlers import one symbol:
 *
 *   import { LIMITS, isRateLimited } from "@/lib/security/rate-limit";
 *   const limited = await isRateLimited(ip, LIMITS.AUTH.limit, LIMITS.AUTH.intervalSeconds);
 */

import {
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { docClient } from "@/lib/dynamo/client";

// ---------------------------------------------------------------------------
// Table & key helpers
// ---------------------------------------------------------------------------

const TABLE = "StreakProofs";

const bucketKey = (identifier: string) => ({
  pk: `RATE_LIMIT#${identifier}`,
  sk: "BUCKET",
});

// ---------------------------------------------------------------------------
// Pre-defined rate limit profiles
// ---------------------------------------------------------------------------

export const LIMITS = {
  /** /api/proofs/submit — 5 req/min per user handle */
  PROOF_SUBMIT: { limit: 5, intervalSeconds: 60 },
  /** /api/auth/* — 10 req/min per IP address */
  AUTH: { limit: 10, intervalSeconds: 60 },
  /** /api/reports/generate-now — 3 req/min per user handle */
  REPORT_GENERATE: { limit: 3, intervalSeconds: 60 },
  /** Public endpoints — 30 req/min per IP */
  PUBLIC_LISTING: { limit: 30, intervalSeconds: 60 },
} as const;

// ---------------------------------------------------------------------------
// isRateLimited
// ---------------------------------------------------------------------------

/**
 * Token-bucket rate-limit check using DynamoDB as the shared store.
 *
 * @param identifier     Unique key: user handle OR client IP address.
 * @param limit          Maximum number of tokens (requests) allowed per interval.
 * @param intervalSeconds  Refill window in seconds (tokens fully replenish each window).
 * @returns              `true` if the request should be denied (rate limited),
 *                       `false` if the request is allowed.
 */
export async function isRateLimited(
  identifier: string,
  limit: number,
  intervalSeconds: number,
): Promise<boolean> {
  const key = bucketKey(identifier);
  const now = Date.now();
  const refillIntervalMs = intervalSeconds * 1000;

  // ── 1. Fetch current bucket state ──────────────────────────────────────
  let currentTokens = limit; // assume full bucket on first request
  let lastRefill = now;

  try {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE, Key: key }),
    );

    if (result.Item) {
      currentTokens = result.Item.tokens as number;
      lastRefill = result.Item.last_refill as number;
    }
  } catch {
    // If DynamoDB is unavailable, fail open to avoid blocking all traffic.
    console.error("[rate-limit] DynamoDB GetCommand failed — failing open.");
    return false;
  }

  // ── 2. Refill tokens proportionally since last window ──────────────────
  const elapsed = now - lastRefill;
  const refills = Math.floor(elapsed / refillIntervalMs);
  const refillTime = refills > 0 ? lastRefill + refills * refillIntervalMs : lastRefill;
  const refillTokens = Math.min(limit, currentTokens + refills * limit);

  // ── 3. Deny if bucket is empty ─────────────────────────────────────────
  if (refillTokens < 1) {
    return true; // rate limited
  }

  // ── 4. Decrement token and write back with optimistic-lock condition ───
  const newTokens = refillTokens - 1;

  try {
    if (currentTokens === limit && refills === 0) {
      // First-ever request for this identifier — create the item.
      await docClient.send(
        new PutCommand({
          TableName: TABLE,
          Item: {
            ...key,
            tokens: newTokens,
            last_refill: refillTime,
            // TTL: auto-expire bucket items after 2× the interval to keep the table clean.
            ttl: Math.floor((now + refillIntervalMs * 2) / 1000),
          },
          // Only write if the item doesn't already exist (race guard).
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      );
    } else {
      // Update existing bucket with optimistic concurrency on the token count.
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: key,
          UpdateExpression:
            "SET tokens = :newTokens, last_refill = :refillTime, #ttl = :ttl",
          // Ensure the token value hasn't been modified by a concurrent request.
          ConditionExpression: "tokens = :expectedTokens",
          ExpressionAttributeNames: { "#ttl": "ttl" },
          ExpressionAttributeValues: {
            ":newTokens": newTokens,
            ":refillTime": refillTime,
            ":ttl": Math.floor((now + refillIntervalMs * 2) / 1000),
            ":expectedTokens": currentTokens,
          },
        }),
      );
    }
  } catch (err) {
    // ConditionalCheckFailedException means a concurrent request already modified
    // the bucket — treat this request as rate-limited to be conservative.
    if (err instanceof ConditionalCheckFailedException) {
      return true;
    }
    // Any other DynamoDB error — fail open.
    console.error("[rate-limit] DynamoDB write failed — failing open.", err);
    return false;
  }

  return false; // allowed
}
