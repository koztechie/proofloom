/**
 * lib/dynamo/schema.ts
 *
 * Single-Table Design (STD) contract for the "StreakProofs" DynamoDB table.
 *
 * ─────────────────────── Access Patterns ───────────────────────────────────
 *
 * Pattern 1 — Get all proofs for a user (sorted newest-first)
 *   PK = USER#<handle>, SK begins_with PROOF#
 *   → used by: getProofsByHandle, streak calculation, dashboard
 *
 * Pattern 2 — Get proofs for a specific date range (weekly reader)
 *   PK = USER#<handle>, SK BETWEEN PROOF#<start> AND PROOF#<end>
 *   → used by: getWeeklyProofs (weekly-reader), report generator
 *
 * Pattern 3 — Get all proofs for a challenge (cross-user)
 *   GSI1: gsi1pk = CHALLENGE#<id>, gsi1sk begins_with PROOF#
 *   → used by: getProofsByChallenge
 *
 * Pattern 4 — Query leaderboard by partition
 *   PK = LEADERBOARD, SK begins_with SCORE#
 *   → used by: getLeaderboard
 *
 * Pattern 5 — Rate-limit token buckets
 *   PK = RATE_LIMIT#<identifier>, SK = BUCKET
 *   → used by: lib/security/rate-limit.ts
 *
 * ────────────────────── Key Schema ─────────────────────────────────────────
 *
 * Base table
 *   pk   (HASH)
 *   sk   (RANGE)
 *
 * GSI1 (challenge-based queries)
 *   gsi1pk (HASH)   = CHALLENGE#<challengeId>
 *   gsi1sk (RANGE)  = PROOF#<date>
 *   Projection: ALL
 *
 * GSI2 (user-id-based queries — separate from handle-based primary key)
 *   gsi2pk (HASH)   = USER_ID#<userId>
 *   gsi2sk (RANGE)  = PROOF#<date>
 *   Projection: ALL
 */

export const TABLE_NAME = "StreakProofs" as const;

export const GSI1_NAME = "gsi1pk-gsi1sk-index" as const;
export const GSI2_NAME = "gsi2pk-gsi2sk-index" as const;

// ── Key builder helpers ─────────────────────────────────────────────────────

export const Keys = {
  /** Primary key for a user's proof items. */
  proofPk: (handle: string) => `USER#${handle}` as const,
  /** Sort key for a specific proof date. */
  proofSk: (date: string) => `PROOF#${date}` as const,

  /** GSI1 partition key — groups all proofs for a single challenge. */
  challengeGsi1Pk: (challengeId: string) => `CHALLENGE#${challengeId}` as const,

  /** GSI2 partition key — query by internal user UUID instead of handle. */
  userIdGsi2Pk: (userId: string) => `USER_ID#${userId}` as const,

  /** Leaderboard partition key. */
  leaderboardPk: () => "LEADERBOARD" as const,
  /** Leaderboard sort key. */
  leaderboardSk: (handle: string, category: string) =>
    `SCORE#${handle}#${category}` as const,

  /** Rate-limit bucket partition key. */
  rateLimitPk: (identifier: string) => `RATE_LIMIT#${identifier}` as const,
  /** Rate-limit bucket sort key (singleton per identifier). */
  rateLimitSk: () => "BUCKET" as const,
} as const;
