import pool from "./client";

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  skill_category: string;
  target_days: number;
  start_date: Date;
  is_public: boolean;
  streak_broken_at: Date | null;
  created_at: Date;
}

export async function createChallenge(
  userId: string,
  title: string,
  skillCategory: string,
  targetDays: number = 30,
  isPublic: boolean = true,
): Promise<Challenge> {
  const query = `
    INSERT INTO challenges (user_id, title, skill_category, target_days, is_public)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [userId, title, skillCategory, targetDays, isPublic];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getChallengesByUserId(
  userId: string,
  options?: { publicOnly?: boolean },
): Promise<Challenge[]> {
  let query = "SELECT * FROM challenges WHERE user_id = $1";
  const values: any[] = [userId];

  if (options?.publicOnly) {
    query += " AND is_public = TRUE";
  }

  query += " ORDER BY created_at DESC;";

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  const query = "SELECT * FROM challenges WHERE id = $1 LIMIT 1;";
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

export async function getPublicChallengesByCategory(
  category: string,
  limit: number = 20,
): Promise<Challenge[]> {
  const query = `
    SELECT * FROM challenges 
    WHERE is_public = TRUE AND skill_category = $1 
    ORDER BY created_at DESC 
    LIMIT $2;
  `;
  const { rows } = await pool.query(query, [category, limit]);
  return rows;
}
