/**
 * lib/dynamo/proofs.ts
 *
 * Proof CRUD operations — Single-Table Design.
 *
 * Public API:
 *   createProof(params)          — write a new proof (conditional: no overwrites)
 *   getProofsByHandle(handle)    — query by USER#<handle> PK (backward-compat)
 *   getProofsByChallenge(id)     — query via GSI1 (CHALLENGE#<id>)
 *   submitProof(params)          — legacy wrapper: createProof + updateLeaderboard
 */

import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { sendWithRetry } from "./client";
import { TABLE_NAME, GSI1_NAME, Keys } from "./schema";
import type { ProofEntity, ProofPayload, ProofView } from "./types";
import { ConflictError } from "@/lib/api/errors";

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Maps a raw DynamoDB item back to the legacy ProofView shape. */
function toProofView(item: Record<string, unknown>): ProofView {
  return {
    pk:           String(item["pk"] ?? ""),
    sk:           String(item["sk"] ?? ""),
    challenge_id: String(item["challengeId"] ?? item["challenge_id"] ?? ""),
    proof_text:   String(item["proofText"]   ?? item["proof_text"]   ?? ""),
    proof_url:    (item["proofUrl"] ?? item["proof_url"] ?? null) as string | null,
    streak_day:   Number(item["streakDay"]   ?? item["streak_day"]   ?? 0),
    ai_score:     Number(item["aiScore"]     ?? item["ai_score"]     ?? 0),
    ai_comment:   String(item["aiComment"]   ?? item["ai_comment"]   ?? ""),
    submitted_at: String(item["createdAt"]   ?? item["submitted_at"] ?? ""),
  };
}

/** Builds the full DynamoDB item from a ProofEntity. */
function buildItem(entity: ProofEntity): Record<string, unknown> {
  const payload = entity.payload;
  return {
    // Keys
    pk:       entity.pk,
    sk:       entity.sk,
    gsi1pk:   entity.gsi1pk,
    gsi1sk:   entity.gsi1sk,
    gsi2pk:   entity.gsi2pk,
    gsi2sk:   entity.gsi2sk,
    // Metadata
    entityType: entity.entityType,
    createdAt:  entity.createdAt,
    updatedAt:  entity.updatedAt,
    // Payload fields (written flat for efficient attribute projections)
    challengeId: payload.challengeId,
    proofText:   payload.proofText,
    proofUrl:    payload.proofUrl,
    streakDay:   payload.streakDay,
    aiScore:     payload.aiScore,
    aiComment:   payload.aiComment,
    userId:      payload.userId,
  };
}

// ── createProof ──────────────────────────────────────────────────────────────

/**
 * Writes a proof to DynamoDB with a conditional expression that prevents
 * silently overwriting an already-submitted proof for the same day.
 *
 * @throws ConflictError  if a proof for pk+sk already exists.
 */
export async function createProof(proof: ProofEntity): Promise<void> {
  try {
    await sendWithRetry(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: buildItem(proof),
        // Idempotency guard: fail if an item with this pk+sk already exists.
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      }),
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new ConflictError(
        "A proof for this challenge has already been submitted today.",
      );
    }
    throw err;
  }
}

// ── getProofsByHandle ────────────────────────────────────────────────────────

/**
 * Returns all proofs for a user, newest first.
 * Backward-compatible: returns ProofView[] matching the legacy Proof interface.
 */
export async function getProofsByHandle(handle: string): Promise<ProofView[]> {
  const result = await sendWithRetry(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk":     Keys.proofPk(handle),
        ":prefix": "PROOF#",
      },
      ScanIndexForward: false,
    }),
  );

  return (result.Items ?? []).map((item: Record<string, unknown>) =>
    toProofView(item),
  );
}

// ── getProofsByChallenge ────────────────────────────────────────────────────

/**
 * Returns all proofs for a given challenge across all users.
 * Uses GSI1 (gsi1pk = CHALLENGE#<id>), newest first.
 */
export async function getProofsByChallenge(
  challengeId: string,
): Promise<ProofView[]> {
  const result = await sendWithRetry(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression: "gsi1pk = :pk AND begins_with(gsi1sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk":     Keys.challengeGsi1Pk(challengeId),
        ":prefix": "PROOF#",
      },
      ScanIndexForward: false,
    }),
  );

  return (result.Items ?? []).map((item: Record<string, unknown>) =>
    toProofView(item),
  );
}

// ── getProofsByUser ─────────────────────────────────────────────────────────

/**
 * Returns all proofs for a user identified by their internal UUID.
 * Uses GSI2 (gsi2pk = USER_ID#<id>), newest first.
 */
export async function getProofsByUser(userId: string): Promise<ProofView[]> {
  const result = await sendWithRetry(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi2pk-gsi2sk-index",
      KeyConditionExpression: "gsi2pk = :pk AND begins_with(gsi2sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": Keys.userIdGsi2Pk(userId),
        ":prefix": "PROOF#",
      },
      ScanIndexForward: false,
    }),
  );

  return (result.Items ?? []).map((item: Record<string, unknown>) =>
    toProofView(item),
  );
}

// ── submitProof (legacy wrapper) ─────────────────────────────────────────────

/**
 * @deprecated Prefer calling createProof() directly.
 * Kept for backward compatibility with existing API routes.
 *
 * Writes the proof via createProof and atomically updates the leaderboard
 * entry for the given user/category pair.
 */
export async function submitProof(params: {
  handle: string;
  challengeId: string;
  proofText: string;
  proofUrl?: string;
  streakDay: number;
  aiScore: number;
  aiComment: string;
  userId?: string;
  skillCategory?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const date = now.split("T")[0] ?? new Date().toISOString().substring(0, 10);
  const userId = params.userId ?? "";

  const payload: ProofPayload = {
    challengeId: params.challengeId,
    proofText:   params.proofText,
    proofUrl:    params.proofUrl ?? null,
    streakDay:   params.streakDay,
    aiScore:     params.aiScore,
    aiComment:   params.aiComment,
    userId,
  };

  const entity: ProofEntity = {
    pk:         Keys.proofPk(params.handle),
    sk:         Keys.proofSk(date),
    gsi1pk:     Keys.challengeGsi1Pk(params.challengeId),
    gsi1sk:     Keys.proofSk(date),
    gsi2pk:     Keys.userIdGsi2Pk(userId),
    gsi2sk:     Keys.proofSk(date),
    entityType: "PROOF",
    createdAt:  now,
    updatedAt:  now,
    payload,
  };

  await createProof(entity);

  // Atomically update the leaderboard score for the user/category pair
  if (params.skillCategory) {
    await sendWithRetry(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: Keys.leaderboardPk(),
          sk: Keys.leaderboardSk(params.handle, params.skillCategory),
        },
        // ADD is idempotent: creates the attribute if absent, increments if present
        UpdateExpression:
          "ADD totalScore :score SET handle = :handle, #cat = :cat, entityType = :et, updatedAt = :now",
        ExpressionAttributeNames: {
          "#cat": "category", // "category" is not a reserved word, but using alias for safety
        },
        ExpressionAttributeValues: {
          ":score":  params.aiScore,
          ":handle": params.handle,
          ":cat":    params.skillCategory,
          ":et":     "LEADERBOARD_ENTRY",
          ":now":    now,
        },
      }),
    );
  }
}
