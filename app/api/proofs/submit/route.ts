/**
 * app/api/proofs/submit/route.ts
 *
 * Proof submission endpoint.
 * Security layers (in order):
 *   1. withApiErrorHandler  — requestId generation, unified error envelope
 *   2. Session authentication via requireAuth()
 *   3. User-based rate limiting  (5 req/min)
 *   4. Zod schema validation of the request body
 *   5. Ownership check — challenge must belong to the requesting user
 *   6. Idempotency guard — only one proof per challenge per calendar day
 */

import type { NextRequest } from "next/server";
import { withApiErrorHandler } from "@/app/api/error-handler";
import { successResponse } from "@/lib/api/response";
import {
  UnauthorizedApiError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  ConflictError,
} from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/guards";
import { UnauthorizedError as GuardUnauthorizedError } from "@/lib/auth/guards";
import { isRateLimited, LIMITS } from "@/lib/security/rate-limit";
import { ProofSubmitSchema } from "@/lib/validation/schemas";
import { getChallengeById } from "@/lib/db/challenges";
import { evaluateProof } from "@/lib/ai/evaluator";
import { submitProof, getProofsByHandle } from "@/lib/dynamo/proofs";
import { getCurrentStreak } from "@/lib/dynamo/streaks";
import { sanitizeText } from "@/lib/security/sanitize";

export const POST = withApiErrorHandler(async (req: NextRequest, _ctx, requestId) => {
  // ── 1. Authentication ──────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth({ redirectOnFailure: false });
  } catch (err) {
    if (err instanceof GuardUnauthorizedError) {
      throw new UnauthorizedApiError(err.message);
    }
    throw err;
  }

  // ── 2. Rate limiting (per user handle) ────────────────────────────────────
  const limited = await isRateLimited(
    user.handle,
    LIMITS.PROOF_SUBMIT.limit,
    LIMITS.PROOF_SUBMIT.intervalSeconds,
  );
  if (limited) {
    throw new RateLimitError(
      "Too many proof submissions. Please wait before trying again.",
      LIMITS.PROOF_SUBMIT.intervalSeconds,
    );
  }

  // ── 3. Request body validation ─────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }

  const parsed = ProofSubmitSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError(
      "Proof submission data is invalid.",
      parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    );
  }

  const { challengeId, proofText, proofUrl } = parsed.data;

  // ── 4. Ownership check ─────────────────────────────────────────────────────
  const challenge = await getChallengeById(challengeId);
  if (!challenge || challenge.user_id !== user.id) {
    throw new NotFoundError("Challenge not found or access denied.");
  }

  // ── 5. Idempotency guard (one proof per challenge per day) ─────────────────
  const todayStr = new Date().toISOString().split("T")[0];
  const existingProofs = await getProofsByHandle(user.handle);
  const alreadySubmittedToday = existingProofs.some(
    (p) => p.sk === `PROOF#${todayStr}` && p.challenge_id === challengeId,
  );
  if (alreadySubmittedToday) {
    throw new ConflictError(
      "You have already submitted a proof for this challenge today. Keep it up tomorrow!",
    );
  }

  // ── 6. AI evaluation ───────────────────────────────────────────────────────
  const currentStreak = await getCurrentStreak(user.handle);
  const streakDay = currentStreak + 1;

  const evaluation = await evaluateProof(
    challenge.skill_category,
    proofText,
    proofUrl,
  );

  // ── 7. Persist proof + update leaderboard ─────────────────────────────────
  await submitProof({
    handle: user.handle,
    challengeId,
    proofText: sanitizeText(proofText),
    ...(proofUrl !== undefined ? { proofUrl } : {}),
    streakDay,
    aiScore: evaluation.score,
    aiComment: evaluation.comment,
    skillCategory: challenge.skill_category,
  });

  return successResponse(
    { score: evaluation.score, comment: evaluation.comment, streakDay },
    undefined,
    201,
    requestId,
  );
});
