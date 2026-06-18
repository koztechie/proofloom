/**
 * app/api/reports/generate-now/route.ts
 *
 * Manual weekly-report generation trigger.
 * Security layers:
 *   1. Session authentication via requireAuth()
 *   2. User-based rate limiting (3 req/min) — AI report generation is expensive
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, UnauthorizedError } from "@/lib/auth/guards";
import { isRateLimited, LIMITS } from "@/lib/security/rate-limit";
import pool from "@/lib/db/client";
import { generateAndSaveWeeklyReport } from "@/lib/reports/generator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  // ── 2. Rate limiting (per user handle — AI generation is costly) ─────────
  const limited = await isRateLimited(
    user.handle,
    LIMITS.REPORT_GENERATE.limit,
    LIMITS.REPORT_GENERATE.intervalSeconds,
  );
  if (limited) {
    return NextResponse.json(
      {
        error:
          "Report generation is rate-limited. Please wait before triggering again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(LIMITS.REPORT_GENERATE.intervalSeconds),
        },
      },
    );
  }

  // ── 3. Business logic ────────────────────────────────────────────────────
  try {
    // Calculate the start of the current ISO week (last Monday).
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    // Fetch the user's first active public challenge.
    const { rows } = await pool.query(
      `
      SELECT id, skill_category, title
      FROM challenges
      WHERE user_id = $1 AND is_public = TRUE AND streak_broken_at IS NULL
      LIMIT 1
      `,
      [user.id],
    );

    if (!rows.length) {
      return NextResponse.json(
        {
          error:
            "No active public challenge found. Create a challenge and submit a proof first.",
        },
        { status: 400 },
      );
    }

    await generateAndSaveWeeklyReport(
      user.id,
      user.handle,
      rows[0].id,
      rows[0].skill_category,
      rows[0].title,
      weekStart,
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Manual report generation failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
