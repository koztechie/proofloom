/**
 * app/api/cron/check-streaks/route.ts
 *
 * Cron job: scans all users and marks challenge streaks as broken for any
 * user who has not submitted a proof today.
 *
 * Protected by CRON_SECRET (Vercel sets this header automatically).
 * Wrapped with withApiErrorHandler for consistent error envelopes and logging.
 */

import type { NextRequest } from "next/server";
import { withApiErrorHandler } from "@/app/api/error-handler";
import { successResponse } from "@/lib/api/response";
import { UnauthorizedApiError } from "@/lib/api/errors";
import pool from "@/lib/db/client";
import { getCurrentStreak } from "@/lib/dynamo/streaks";

// Prevent Vercel from caching cron responses.
export const dynamic = "force-dynamic";

export const GET = withApiErrorHandler(async (req: NextRequest, _ctx, requestId) => {
  // ── Cron secret guard ──────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new UnauthorizedApiError("Invalid or missing cron secret.");
  }

  // ── Fetch all users ────────────────────────────────────────────────────────
  const { rows: users } = await pool.query<{ id: string; handle: string }>(
    "SELECT id, handle FROM users;",
  );

  let brokenCount = 0;

  // ── Check streak per user and mark broken challenges ──────────────────────
  for (const user of users) {
    const currentStreak = await getCurrentStreak(user.handle);

    if (currentStreak === 0) {
      const result = await pool.query(
        `UPDATE challenges
         SET streak_broken_at = NOW()
         WHERE user_id = $1 AND streak_broken_at IS NULL`,
        [user.id],
      );
      brokenCount += result.rowCount ?? 0;
    }
  }

  return successResponse(
    {
      message: `Cron executed successfully. Marked ${brokenCount} challenges as broken.`,
      brokenCount,
    },
    undefined,
    200,
    requestId,
  );
});
