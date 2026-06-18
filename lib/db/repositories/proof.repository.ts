/**
 * Proof repository — typed operations over the `proofs` table.
 *
 * `create` runs a Drizzle transaction that inserts the proof and upserts
 * leaderboard_entries atomically. `db` is loaded via dynamic import().
 */

import { eq, desc, sql } from "drizzle-orm";
import { proofs, leaderboardEntries } from "../schema";

export type ProofRow = typeof proofs.$inferSelect;
export type NewProof = typeof proofs.$inferInsert;

async function getDb() {
  const { db } = await import("../drizzle");
  return db;
}

// ---------------------------------------------------------------------------
// create — transactional insert + leaderboard upsert
// ---------------------------------------------------------------------------
export async function create(params: NewProof): Promise<ProofRow> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    // 1. Insert the proof record
    const [proof] = await tx.insert(proofs).values(params).returning();
    if (!proof) throw new Error("Failed to create proof");

    // 2. Upsert leaderboard_entries: add score, increment streak counter
    await tx
      .insert(leaderboardEntries)
      .values({
        userId: proof.userId,
        challengeId: proof.challengeId,
        totalScore: proof.score,
        streakDays: 1,
      })
      .onConflictDoUpdate({
        target: [leaderboardEntries.userId, leaderboardEntries.challengeId],
        set: {
          totalScore: sql`leaderboard_entries.total_score + ${proof.score}`,
          streakDays: sql`leaderboard_entries.streak_days + 1`,
          updatedAt: sql`NOW()`,
        },
      });

    return proof;
  });
}

// ---------------------------------------------------------------------------
// getByChallenge — all proofs for a challenge, newest first
// ---------------------------------------------------------------------------
export async function getByChallenge(challengeId: string): Promise<ProofRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(proofs)
    .where(eq(proofs.challengeId, challengeId))
    .orderBy(desc(proofs.createdAt));
}

// ---------------------------------------------------------------------------
// getRecent — most recent N proofs for a user
// ---------------------------------------------------------------------------
export async function getRecent(
  userId: string,
  limit: number = 10,
): Promise<ProofRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(proofs)
    .where(eq(proofs.userId, userId))
    .orderBy(desc(proofs.createdAt))
    .limit(limit);
}
