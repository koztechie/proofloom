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
import { createNotification } from "@/lib/notifications/in-app";
import { sendEmail, streakReminder } from "@/lib/notifications/email";

// Prevent Vercel from caching cron responses.
export const dynamic = "force-dynamic";

export const GET = withApiErrorHandler(async (req: NextRequest, _ctx, requestId) => {
  // ── Cron secret guard ──────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new UnauthorizedApiError("Invalid or missing cron secret.");
  }

  // ── Fetch all users ────────────────────────────────────────────────────────
  const { rows: users } = await pool.query<{ id: string; handle: string; email: string; display_name: string | null }>(
    "SELECT id, handle, email, display_name FROM users;",
  );

  let brokenCount = 0;

  // ── Check streak per user and mark broken challenges ──────────────────────
  for (const user of users) {
    const currentStreak = await getCurrentStreak(user.handle);

    if (currentStreak === 0) {
      // Find challenges that are about to be marked as broken
      const { rows: challengesToBreak } = await pool.query(
        `SELECT id, title FROM challenges WHERE user_id = $1 AND streak_broken_at IS NULL`,
        [user.id]
      );

      for (const challenge of challengesToBreak) {
        await createNotification({
          userId: user.id,
          type: "streak_reminder",
          title: "Streak at risk! 🔥",
          message: `Your streak for "${challenge.title}" is less than 24 hours away from breaking.`,
          link: `/challenge/${challenge.id}`,
          priority: "high",
        });

        const emailTemplate = streakReminder(
          { email: user.email, handle: user.handle, display_name: user.display_name },
          { title: challenge.title }
        );

        await sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });
      }

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
