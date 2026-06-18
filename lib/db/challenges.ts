/**
 * lib/db/challenges.ts
 *
 * @deprecated These are thin compatibility wrappers around the new
 * `lib/db/repositories/challenge.repository.ts`. Existing call sites continue
 * to work without modification. Migrate new code to import directly from the
 * repository module.
 */

import * as challengeRepo from "./repositories/challenge.repository";
import { Challenge } from "@/types";

/** Maps a Drizzle camelCase row to the snake_case legacy shape. */
function toChallenge(row: challengeRepo.ChallengeRow): Challenge {
  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    skill_category: row.skillCategory,
    target_days: row.targetDays ?? 30,
    start_date: row.startDate ?? null,
    is_public: row.isPublic ?? true,
    streak_broken_at: row.streakBrokenAt ?? null,
    created_at: row.createdAt ?? new Date(0),
  };
}

/** @deprecated Use challengeRepo.create() directly. */
export async function createChallenge(
  userId: string,
  title: string,
  skillCategory: string,
  targetDays: number = 30,
  isPublic: boolean = true,
): Promise<Challenge> {
  const row = await challengeRepo.create({ userId, title, skillCategory, targetDays, isPublic });
  return toChallenge(row);
}

/** @deprecated Use challengeRepo.getByUser() directly. */
export async function getChallengesByUserId(
  userId: string,
  options?: { publicOnly?: boolean },
): Promise<Challenge[]> {
  const rows = await challengeRepo.getByUser(userId, options);
  return rows.map(toChallenge);
}

/** @deprecated Use challengeRepo.getById() directly. */
export async function getChallengeById(id: string): Promise<Challenge | null> {
  const row = await challengeRepo.getById(id);
  return row ? toChallenge(row) : null;
}

/** @deprecated Use challengeRepo.getPublic() directly. */
export async function getPublicChallengesByCategory(
  category: string,
  limit: number = 20,
): Promise<Challenge[]> {
  const rows = await challengeRepo.getPublic(category, limit);
  return rows.map(toChallenge);
}
