/**
 * lib/dynamo/streaks.ts
 *
 * Streak CRUD operations — Single-Table Design.
 *
 * Public API:
 *   getStreak(handle)            — fetch the user's streak item
 *   updateStreak(streak)         — upsert a streak item
 *   getCurrentStreak(handle)     — legacy alias returning just the current count
 *   getTotalProofScore(handle)   — calculates total ai_score across all proofs
 */

import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { sendWithRetry } from "./client";
import { TABLE_NAME, Keys } from "./schema";
import type { StreakEntity, StreakPayload } from "./types";
import { getProofsByHandle } from "./proofs";

// ── getStreak ──────────────────────────────────────────────────────────────

/**
 * Fetches the user's explicit StreakEntity using KeyConditionExpression.
 */
export async function getStreak(handle: string): Promise<StreakEntity | null> {
  const result = await sendWithRetry(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: {
        ":pk": Keys.proofPk(handle),
        ":sk": "STREAK", // We'll just use "STREAK" as the SK for the streak item
      },
    }),
  );

  const item = result.Items?.[0];
  if (!item) return null;

  return {
    pk: String(item.pk),
    sk: String(item.sk),
    entityType: String(item.entityType),
    createdAt: String(item.createdAt),
    updatedAt: String(item.updatedAt),
    payload: {
      handle: String(item.handle ?? ""),
      currentStreak: Number(item.currentStreak ?? 0),
      longestStreak: Number(item.longestStreak ?? 0),
      lastProofDate: String(item.lastProofDate ?? ""),
    },
  } as StreakEntity;
}

// ── updateStreak ───────────────────────────────────────────────────────────

/**
 * Upserts a streak item.
 */
export async function updateStreak(streak: StreakEntity): Promise<void> {
  const p = streak.payload;
  const now = new Date().toISOString();

  await sendWithRetry(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: streak.pk,
        sk: streak.sk,
      },
      UpdateExpression:
        "SET handle = :handle, currentStreak = :cs, longestStreak = :ls, lastProofDate = :lpd, entityType = :et, updatedAt = :now",
      ExpressionAttributeValues: {
        ":handle": p.handle,
        ":cs": p.currentStreak,
        ":ls": p.longestStreak,
        ":lpd": p.lastProofDate,
        ":et": "STREAK",
        ":now": now,
      },
    }),
  );
}

// ── getCurrentStreak (legacy wrapper) ──────────────────────────────────────

/**
 * Legacy wrapper: returns just the current streak count.
 * Calculates it dynamically from proofs if the StreakEntity is missing or
 * out-of-date, and returns 0 if broken.
 */
export async function getCurrentStreak(handle: string): Promise<number> {
  const streakEntity = await getStreak(handle);
  
  // If we have an explicit streak item, check if it's still valid today or yesterday
  if (streakEntity) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().substring(0, 10);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);
    
    const lastDate = streakEntity.payload.lastProofDate;
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      return streakEntity.payload.currentStreak;
    } else {
      return 0; // broken
    }
  }

  // Fallback: calculate dynamically
  const proofs = await getProofsByHandle(handle);
  if (proofs.length === 0) return 0;

  const dates = proofs
    .map((p) => p.sk.split("#")[1])
    .filter((value, index, self) => value && self.indexOf(value) === index);

  if (dates.length === 0) return 0;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().substring(0, 10);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);

  const newestDateStr = dates[0];
  if (newestDateStr !== todayStr && newestDateStr !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(newestDateStr!);

  for (let i = 0; i < dates.length; i++) {
    const checkDateStr = dates[i];
    const expectedStr = currentDate.toISOString().substring(0, 10);

    if (i === 0 || expectedStr === checkDateStr) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ── getTotalProofScore ─────────────────────────────────────────────────────

export async function getTotalProofScore(handle: string): Promise<number> {
  const proofs = await getProofsByHandle(handle);
  return proofs.reduce((sum, p) => sum + (p.ai_score || 0), 0);
}
