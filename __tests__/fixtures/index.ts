import { createUser } from "@/lib/db/users";
import {
  create as createChallenge,
  ChallengeRow,
} from "@/lib/db/repositories/challenge.repository";
import { submitProof } from "@/lib/dynamo/proofs";
import pool from "@/lib/db/client";
import crypto from "crypto";

export async function userFactory(overrides?: Partial<any>) {
  const handle =
    overrides?.handle || `user_${crypto.randomUUID().substring(0, 8)}`;
  const email = overrides?.email || `${handle}@example.com`;
  const passwordHash = await bcryptHash("password"); // або bcrypt.hash
  const displayName = overrides?.displayName || "Test User";

  return await createUser(handle, email, "Password123", displayName);
}

// Допоміжна функція швидкого хешування для тестів
async function bcryptHash(pwd: string) {
  const bcrypt = require("bcryptjs");
  return await bcrypt.hash(pwd, 10);
}

export async function challengeFactory(overrides?: Partial<any>) {
  let userId = overrides?.userId;
  if (!userId) {
    const user = await userFactory();
    userId = user.id;
  }

  const skillCategory = overrides?.skillCategory || "SQL";
  const title = overrides?.title || "Test Challenge";
  const targetDays = overrides?.targetDays || 30;
  const isPublic =
    overrides?.isPublic !== undefined ? overrides.isPublic : true;

  return await createChallenge({
    userId,
    title,
    skillCategory,
    targetDays,
    isPublic,
  });
}

export async function proofFactory(overrides?: Partial<any>) {
  let challengeId = overrides?.challengeId;
  let handle = overrides?.handle;

  if (!challengeId) {
    const challenge = await challengeFactory();
    challengeId = challenge.id;
    const userResult = await pool.query(
      "SELECT handle FROM users WHERE id = $1 LIMIT 1;",
      [challenge.userId],
    );
    handle = userResult.rows[0].handle;
  }

  const proofText =
    overrides?.proofText ||
    "Completed Task 3: wrote 3 SQL queries using JOIN, GROUP BY with HAVING, and NOT EXISTS pattern.";
  const aiScore = overrides?.aiScore || 85;
  const aiComment =
    overrides?.aiComment || "AI evaluation completed successfully.";
  const streakDay = overrides?.streakDay || 1;
  const skillCategory = overrides?.skillCategory || "SQL";

  await submitProof({
    handle: handle!,
    challengeId,
    proofText,
    aiScore,
    aiComment,
    streakDay,
    skillCategory,
  });

  return {
    pk: `USER#${handle}`,
    sk: `PROOF#${new Date().toISOString().split("T")[0]}`,
    challenge_id: challengeId,
    proof_text: proofText,
    proof_url: null,
    streak_day: streakDay,
    ai_score: aiScore,
    ai_comment: aiComment,
    submitted_at: new Date().toISOString(),
  };
}
