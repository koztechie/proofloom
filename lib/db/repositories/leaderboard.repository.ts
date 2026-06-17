/**
 * Leaderboard repository — typed reads and rank-update operations over the
 * `leaderboard_entries` table. `db` is loaded via dynamic import().
 */

import { eq, desc, sql } from "drizzle-orm";
import { leaderboardEntries, users, challenges } from "../schema";

export type LeaderboardRow = typeof leaderboardEntries.$inferSelect;

export type LeaderboardEntryWithMeta = LeaderboardRow & {
  handle: string | null;
  skillCategory: string;
};

async function getDb() {
  const { db } = await import("../drizzle");
  return db;
}

// ---------------------------------------------------------------------------
// getTop — top N entries by total_score (joined with user handle)
// ---------------------------------------------------------------------------
export async function getTop(limit: number = 100): Promise<LeaderboardEntryWithMeta[]> {
  const db = await getDb();
  return db
    .select({
      userId: leaderboardEntries.userId,
      challengeId: leaderboardEntries.challengeId,
      totalScore: leaderboardEntries.totalScore,
      streakDays: leaderboardEntries.streakDays,
      rank: leaderboardEntries.rank,
      updatedAt: leaderboardEntries.updatedAt,
      handle: users.handle,
      skillCategory: challenges.skillCategory,
    })
    .from(leaderboardEntries)
    .innerJoin(users, eq(leaderboardEntries.userId, users.id))
    .innerJoin(challenges, eq(leaderboardEntries.challengeId, challenges.id))
    .orderBy(desc(leaderboardEntries.totalScore))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// getByCategory
// ---------------------------------------------------------------------------
export async function getByCategory(
  skillCategory: string,
  limit: number = 20,
): Promise<LeaderboardEntryWithMeta[]> {
  const db = await getDb();
  return db
    .select({
      userId: leaderboardEntries.userId,
      challengeId: leaderboardEntries.challengeId,
      totalScore: leaderboardEntries.totalScore,
      streakDays: leaderboardEntries.streakDays,
      rank: leaderboardEntries.rank,
      updatedAt: leaderboardEntries.updatedAt,
      handle: users.handle,
      skillCategory: challenges.skillCategory,
    })
    .from(leaderboardEntries)
    .innerJoin(users, eq(leaderboardEntries.userId, users.id))
    .innerJoin(challenges, eq(leaderboardEntries.challengeId, challenges.id))
    .where(eq(challenges.skillCategory, skillCategory))
    .orderBy(desc(leaderboardEntries.totalScore))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// updateRanks — recomputes rank for all entries in one window-function CTE
// ---------------------------------------------------------------------------
export async function updateRanks(): Promise<void> {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      WITH ranked AS (
        SELECT
          user_id,
          challenge_id,
          RANK() OVER (ORDER BY total_score DESC) AS new_rank
        FROM leaderboard_entries
      )
      UPDATE leaderboard_entries le
      SET rank = r.new_rank,
          updated_at = NOW()
      FROM ranked r
      WHERE le.user_id = r.user_id
        AND le.challenge_id = r.challenge_id
    `);
  });
}
