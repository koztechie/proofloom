/**
 * lib/db/sync.ts
 *
 * High-performance read cache sync: reads the top 100 leaderboard entries
 * from PostgreSQL and upserts them into DynamoDB (StreakProofs table) under
 * the LEADERBOARD partition key — maintaining the existing Single-Table Design.
 *
 * Call this after `leaderboard.repository.updateRanks()` or from a cron route.
 */

import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../dynamo/client";
import { getTop } from "./repositories/leaderboard.repository";

const DYNAMO_TABLE = process.env.DYNAMO_DYNAMODB_TABLE_NAME ?? "StreakProofs";
// DynamoDB BatchWrite accepts at most 25 items per request
const DYNAMO_BATCH_SIZE = 25;

// Shape written to DynamoDB under pk="LEADERBOARD"
type LeaderboardDynamoItem = {
  pk: "LEADERBOARD";
  sk: string; // SCORE#<handle>#<skillCategory>
  handle: string;
  category: string;
  totalScore: number;
  streakDays: number;
  rank: number | null;
  syncedAt: string;
};

// ---------------------------------------------------------------------------
// syncLeaderboardToDynamoDB
// ---------------------------------------------------------------------------
export async function syncLeaderboardToDynamoDB(): Promise<void> {
  const entries = await getTop(100);

  if (entries.length === 0) return;

  const now = new Date().toISOString();

  // Build DynamoDB PutRequest items
  const putRequests = entries.map((entry) => {
    const item: LeaderboardDynamoItem = {
      pk: "LEADERBOARD",
      sk: `SCORE#${entry.handle}#${entry.skillCategory}`,
      handle: entry.handle ?? "unknown",
      category: entry.skillCategory,
      totalScore: entry.totalScore,
      streakDays: entry.streakDays,
      rank: entry.rank,
      syncedAt: now,
    };

    return {
      PutRequest: { Item: item as Record<string, unknown> },
    };
  });

  // Chunk into batches of 25 (DynamoDB BatchWrite limit)
  const batches: (typeof putRequests)[] = [];
  for (let i = 0; i < putRequests.length; i += DYNAMO_BATCH_SIZE) {
    batches.push(putRequests.slice(i, i + DYNAMO_BATCH_SIZE));
  }

  // Execute batches sequentially to avoid rate-limit errors on small tables
  for (const batch of batches) {
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [DYNAMO_TABLE]: batch,
        },
      }),
    );
  }
}
