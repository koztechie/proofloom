/**
 * app/api/challenges/route.ts
 *
 * GET  /api/challenges  — returns the authenticated user's challenges with
 *                          offset pagination.
 *
 * POST /api/challenges  — creates a new challenge for the authenticated user.
 *                          Body is validated against ChallengeCreateSchema.
 *
 * All handlers are wrapped with withApiErrorHandler for consistent error
 * envelopes and automatic requestId generation.
 */

import type { NextRequest } from "next/server";
import { withApiErrorHandler } from "@/app/api/error-handler";
import { successResponse } from "@/lib/api/response";
import {
  ValidationError,
  UnauthorizedApiError,
} from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/guards";
import { UnauthorizedError as GuardUnauthorizedError } from "@/lib/auth/guards";
import { ChallengeCreateSchema } from "@/lib/validation/schemas";
import { getChallengesByUserId, createChallenge } from "@/lib/db/challenges";
import {
  parsePaginationParams,
  buildOffsetMeta,
} from "@/lib/api/pagination";

// ---------------------------------------------------------------------------
// GET /api/challenges
// ---------------------------------------------------------------------------
export const GET = withApiErrorHandler(async (req: NextRequest, _ctx, requestId) => {
  // Auth
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth({ redirectOnFailure: false });
  } catch (err) {
    if (err instanceof GuardUnauthorizedError) {
      throw new UnauthorizedApiError(err.message);
    }
    throw err;
  }

  // Pagination
  const { limit, offset } = parsePaginationParams(req.nextUrl.searchParams);

  // Data
  const allChallenges = await getChallengesByUserId(user.id);

  // Manual offset slice (DB layer doesn't support pagination yet)
  const paginated = allChallenges.slice(offset, offset + limit);
  const meta = buildOffsetMeta(allChallenges.length, limit, offset);

  return successResponse(paginated, meta, 200, requestId);
});

// ---------------------------------------------------------------------------
// POST /api/challenges
// ---------------------------------------------------------------------------
export const POST = withApiErrorHandler(async (req: NextRequest, _ctx, requestId) => {
  // Auth
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth({ redirectOnFailure: false });
  } catch (err) {
    if (err instanceof GuardUnauthorizedError) {
      throw new UnauthorizedApiError(err.message);
    }
    throw err;
  }

  // Parse & validate body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }

  const parsed = ChallengeCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError(
      "Challenge data is invalid.",
      parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    );
  }

  const { title, skillCategory, targetDays } = parsed.data;

  // DB write
  const challenge = await createChallenge(
    user.id,
    title.trim(),
    skillCategory,
    targetDays,
    true, // default isPublic
  );

  return successResponse(challenge, undefined, 201, requestId);
});
