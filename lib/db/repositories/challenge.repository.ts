/**
 * Challenge repository — typed operations over the `challenges` table.
 *
 * `db` is loaded via dynamic import() so drizzle-orm/node-postgres is never
 * evaluated at module-init time.
 */

import { eq, and, isNull } from "drizzle-orm";
import { challenges } from "../schema";

export type ChallengeRow = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;

async function getDb() {
  const { db } = await import("../drizzle");
  return db;
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------
export async function create(params: NewChallenge): Promise<ChallengeRow> {
  const db = await getDb();
  const [row] = await db.insert(challenges).values(params).returning();
  if (!row) throw new Error("Failed to create challenge");
  return row;
}

// ---------------------------------------------------------------------------
// getByUser
// ---------------------------------------------------------------------------
export async function getByUser(
  userId: string,
  options?: { publicOnly?: boolean },
): Promise<ChallengeRow[]> {
  const db = await getDb();
  const conditions = [eq(challenges.userId, userId)];
  if (options?.publicOnly) conditions.push(eq(challenges.isPublic, true));

  return db
    .select()
    .from(challenges)
    .where(and(...conditions))
    .orderBy(challenges.createdAt);
}

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------
export async function getById(id: string): Promise<ChallengeRow | null> {
  const db = await getDb();
  const result = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, id))
    .limit(1);
  return result[0] ?? null;
}

// ---------------------------------------------------------------------------
// getPublic
// ---------------------------------------------------------------------------
export async function getPublic(
  skillCategory: string,
  limit: number = 20,
): Promise<ChallengeRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(challenges)
    .where(and(eq(challenges.isPublic, true), eq(challenges.skillCategory, skillCategory)))
    .orderBy(challenges.createdAt)
    .limit(limit);
}

// ---------------------------------------------------------------------------
// updateStreak
// ---------------------------------------------------------------------------
export async function updateStreak(
  id: string,
  brokenAt: Date | null,
): Promise<ChallengeRow> {
  const db = await getDb();
  const [row] = await db
    .update(challenges)
    .set({ streakBrokenAt: brokenAt })
    .where(eq(challenges.id, id))
    .returning();
  if (!row) throw new Error("Failed to update streak");
  return row;
}

// ---------------------------------------------------------------------------
// getActivePublic — used by cron jobs
// ---------------------------------------------------------------------------
export async function getActivePublic(): Promise<ChallengeRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(challenges)
    .where(and(eq(challenges.isPublic, true), isNull(challenges.streakBrokenAt)));
}
