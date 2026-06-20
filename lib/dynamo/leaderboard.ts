/**
 * lib/dynamo/leaderboard.ts
 *
 * Leaderboard operations — Single-Table Design.
 *
 * Public API:
 *   updateLeaderboardEntry(entry) — upsert a leaderboard item
 *   getTopEntries(category, limit) — query LEADERBOARD partition, filter & sort
 *   getLeaderboard(category, limit) — legacy alias for getTopEntries
 */

import { UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { sendWithRetry } from "./client";
import { TABLE_NAME, Keys } from "./schema";
import type {
  LeaderboardEntryEntity,
  LeaderboardEntryView,
} from "./types";

// ── updateLeaderboardEntry ───────────────────────────────────────────────────

/**
 * Upserts a leaderboard entry using an atomic SET expression.
 * Call this from batch jobs or backfill scripts when you need to set
 * a precise score rather than increment it.
 */
export async function updateLeaderboardEntry(
  entry: LeaderboardEntryEntity,
): Promise<void> {
  const p = entry.payload;
  const now = new Date().toISOString();

  await sendWithRetry(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: Keys.leaderboardPk(),
        sk: Keys.leaderboardSk(p.handle, p.category),
      },
      UpdateExpression:
        "SET handle = :handle, #cat = :cat, totalScore = :score, entityType = :et, updatedAt = :now",
      ExpressionAttributeNames: {
        "#cat": "category",
      },
      ExpressionAttributeValues: {
        ":handle": p.handle,
        ":cat":    p.category,
        ":score":  p.totalScore,
        ":et":     "LEADERBOARD_ENTRY",
        ":now":    now,
      },
    }),
  );
}

// ── getTopEntries ────────────────────────────────────────────────────────────

/**
 * Queries the LEADERBOARD partition, optionally filters by category, and
 * returns the top <limit> entries sorted by totalScore descending.
 */
export async function getTopEntries(
  category?: string,
  limit = 20,
): Promise<LeaderboardEntryView[]> {
  const result = await sendWithRetry(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk":     Keys.leaderboardPk(),
        ":prefix": "SCORE#",
      },
    }),
  );

  let items = (result.Items ?? []).map((item: Record<string, any>) => ({
    handle:      String(item["handle"]     ?? ""),
    category:    String(item["category"]   ?? ""),
    total_score: Number(item["totalScore"] ?? item["total_score"] ?? 0),
  })) satisfies LeaderboardEntryView[];

  // Filter by category when a specific one is requested
  if (category && category !== "All") {
    items = items.filter((item: LeaderboardEntryView) => item.category === category);
  }

  // Sort descending by score in-memory (DynamoDB LEADERBOARD partition is
  // ordered by SK which is lexicographic, not numeric)
  items.sort((a: LeaderboardEntryView, b: LeaderboardEntryView) => b.total_score - a.total_score);

  return items.slice(0, limit);
}

// ── getLeaderboard (legacy alias) ────────────────────────────────────────────

/**
 * @deprecated Use getTopEntries() for new code.
 * Kept for backward compatibility with app/leaderboard/page.tsx.
 */
export const getLeaderboard = getTopEntries;

/** Re-export the view type so the leaderboard page can import it from here. */
export type { LeaderboardEntryView as LeaderboardEntry };
