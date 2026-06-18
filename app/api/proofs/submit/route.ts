/**
 * app/api/proofs/submit/route.ts
 *
 * Proof submission endpoint.
 * Security layers (in order):
 *   1. Session authentication via requireAuth()
 *   2. User-based rate limiting  (5 req/min)
 *   3. Zod schema validation of the request body
 *   4. Ownership check — challenge must belong to the requesting user
 *   5. Idempotency guard — only one proof per challenge per calendar day
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/guards";
import { isRateLimited, LIMITS } from "@/lib/security/rate-limit";
import { ProofSubmitSchema } from "@/lib/validation/schemas";
import { getChallengeById } from "@/lib/db/challenges";
import { evaluateProof } from "@/lib/ai/evaluator";
import { submitProof, getProofsByHandle } from "@/lib/dynamo/proofs";
import { getCurrentStreak } from "@/lib/dynamo/streaks";

export async function POST(request: NextRequest) {
  // ── 1. Authentication ────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth({ redirectOnFailure: false });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  // ── 2. Rate limiting (per user handle) ──────────────────────────────────
  const limited = await isRateLimited(
    user.handle,
    LIMITS.PROOF_SUBMIT.limit,
    LIMITS.PROOF_SUBMIT.intervalSeconds,
  );
  if (limited) {
    return NextResponse.json(
      { error: "Too many proof submissions. Please wait before trying again." },
      {
        status: 429,
        headers: { "Retry-After": String(LIMITS.PROOF_SUBMIT.intervalSeconds) },
      },
    );
  }

  // ── 3. Request body validation ───────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  const parsed = ProofSubmitSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const { challengeId, proofText, proofUrl } = parsed.data;

  // ── 4. Ownership check ───────────────────────────────────────────────────
  let challenge: Awaited<ReturnType<typeof getChallengeById>>;
  try {
    challenge = await getChallengeById(challengeId);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch challenge." },
      { status: 500 },
    );
  }

  if (!challenge || challenge.user_id !== user.id) {
    return NextResponse.json(
      { error: "Challenge not found or access denied." },
      { status: 404 },
    );
  }

  // ── 5. Idempotency guard (one proof per challenge per day) ───────────────
  const todayStr = new Date().toISOString().split("T")[0];
  const existingProofs = await getProofsByHandle(user.handle);
  const alreadySubmittedToday = existingProofs.some(
    (p) => p.sk === `PROOF#${todayStr}` && p.challenge_id === challengeId,
  );

  if (alreadySubmittedToday) {
    return NextResponse.json(
      {
        error:
          "You have already submitted a proof for this challenge today. Keep it up tomorrow!",
      },
      { status: 409 },
    );
  }

  // ── 6. AI evaluation ─────────────────────────────────────────────────────
  const currentStreak = await getCurrentStreak(user.handle);
  const streakDay = currentStreak + 1;

  const evaluation = await evaluateProof(
    challenge.skill_category,
    proofText,
    proofUrl,
  );

  // ── 7. Persist proof + update leaderboard ────────────────────────────────
  await submitProof({
    handle: user.handle,
    challengeId,
    proofText,
    // exactOptionalPropertyTypes: only spread the key when the value is defined
    ...(proofUrl !== undefined ? { proofUrl } : {}),
    streakDay,
    aiScore: evaluation.score,
    aiComment: evaluation.comment,
    skillCategory: challenge.skill_category,
  });

  return NextResponse.json({
    success: true,
    score: evaluation.score,
    comment: evaluation.comment,
    streakDay,
  });
}
