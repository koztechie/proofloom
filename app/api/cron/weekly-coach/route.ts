/**
 * app/api/cron/weekly-coach/route.ts
 *
 * Cron job: generates AI weekly-coach reports for every user with an active
 * public challenge. Runs on a Monday schedule (configured in vercel.json).
 *
 * Protected by CRON_SECRET (Vercel sets this header automatically).
 * Wrapped with withApiErrorHandler for consistent error envelopes and logging.
 *
 * Per-user failures are logged and silenced so one user's quota limit cannot
 * block the rest of the batch (anti-fragility).
 */

import type { NextRequest } from "next/server";
import { withApiErrorHandler } from "@/app/api/error-handler";
import { successResponse } from "@/lib/api/response";
import { UnauthorizedApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import pool from "@/lib/db/client";
import { generateAndSaveWeeklyReport } from "@/lib/reports/generator";

// Prevent Vercel from caching cron responses.
export const dynamic = "force-dynamic";

interface ChallengeRow {
  challenge_id: string;
  skill_category: string;
  title: string;
  user_id: string;
  handle: string;
}

export const GET = withApiErrorHandler(async (req: NextRequest, _ctx, requestId) => {
  // ── Cron secret guard ──────────────────────────────────────────────────────
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new UnauthorizedApiError("Invalid or missing cron secret.");
  }

  // ── Compute week_start (last Monday at midnight UTC) ───────────────────────
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
  weekStart.setHours(0, 0, 0, 0);

  // ── Fetch all active public challenges ────────────────────────────────────
  const { rows } = await pool.query<ChallengeRow>(`
    SELECT
      c.id          AS challenge_id,
      c.skill_category,
      c.title,
      u.id          AS user_id,
      u.handle
    FROM challenges c
    JOIN users u ON u.id = c.user_id
    WHERE c.is_public = TRUE
      AND c.streak_broken_at IS NULL
  `);

  let processed = 0;
  let failed = 0;

  // ── Generate per-challenge report (isolated failures) ─────────────────────
  for (const row of rows) {
    try {
      await generateAndSaveWeeklyReport(
        row.user_id,
        row.handle,
        row.challenge_id,
        row.skill_category,
        row.title,
        weekStart,
      );
      processed++;
    } catch (err) {
      // Anti-fragility: a single user's AI quota error must not abort the batch.
      failed++;
      logger.warn("Weekly report failed for user", {
        requestId,
        handle: row.handle,
        challengeId: row.challenge_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return successResponse(
    {
      weekStart: weekStart.toISOString().split("T")[0],
      processed,
      failed,
    },
    undefined,
    200,
    requestId,
  );
});
