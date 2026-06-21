import { createUser } from "@/lib/db/users";
import { create as createChallenge } from "@/lib/db/repositories/challenge.repository";
import { submitProof } from "@/lib/dynamo/proofs";
import pool from "@/lib/db/client";
import crypto from "crypto";

export async function userFactory(overrides?: Partial<any>) {
  const id = overrides?.id || undefined;
  const handle =
    overrides?.handle || `user_${crypto.randomUUID().substring(0, 8)}`;
  const email = overrides?.email || `${handle}@example.com`;

  if (id) {
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash("Password123", 10);
    const { rows } = await pool.query(
      `
      INSERT INTO users (id, handle, email, password_hash, display_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `,
      [id, handle, email, passwordHash, "Test User"],
    );
    return rows[0];
  }

  return await createUser(handle, email, "Password123", "Test User");
}

export async function challengeFactory(overrides?: Partial<any> | string) {
  let userId: string;

  if (typeof overrides === "string") {
    userId = overrides;
  } else {
    userId = overrides?.userId || "";
    if (!userId) {
      const user = await userFactory();
      userId = user.id;
    }
  }

  const skillCategory =
    typeof overrides === "string" ? "SQL" : overrides?.skillCategory || "SQL";
  const title =
    typeof overrides === "string"
      ? "Test Challenge"
      : overrides?.title || "Test Challenge";
  const targetDays =
    typeof overrides === "string" ? 30 : overrides?.targetDays || 30;
  const isPublic =
    typeof overrides === "string"
      ? true
      : overrides?.isPublic !== undefined
        ? overrides.isPublic
        : true;

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
