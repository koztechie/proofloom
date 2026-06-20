import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/client";
import { generateAndSaveWeeklyReport } from "@/lib/reports/generator";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import { createNotification } from "@/lib/notifications/in-app";
import { sendEmail, weeklyReportReady } from "@/lib/notifications/email";

// Забороняємо кешування крону на Vercel
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // 1. Захист за допомогою секрету
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    logger.warn("Unauthorized cron attempt", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Starting weekly coach cron job", { requestId });

  // 2. Розраховуємо дату минулого понеділка (week_start)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
  weekStart.setHours(0, 0, 0, 0);

  try {
    // 3. Витягуємо всі активні публічні челенджі з Aurora PostgreSQL
    const { rows } = await pool.query(`
      SELECT
        c.id AS challenge_id,
        c.skill_category,
        c.title,
        u.id AS user_id,
        u.handle
      FROM challenges c
      JOIN users u ON u.id = c.user_id
      WHERE c.is_public = TRUE
        AND c.streak_broken_at IS NULL
    `);

    let processed = 0;
    let failed = 0;

    // 4. Запускаємо генерацію звітів для кожного челенджу
    for (const row of rows) {
      try {
        const report = await generateAndSaveWeeklyReport(
          row.user_id,
          row.handle,
          row.challenge_id,
          row.skill_category,
          row.title,
          weekStart,
        );

        if (report) {
          await createNotification({
            userId: row.user_id,
            type: "weekly_report",
            title: "Weekly AI Coach Report Ready 📊",
            message: `Your AI Coach report for ${row.title} is ready.`,
            link: `/u/${row.handle}`,
            priority: "normal",
          });

          const emailTemplate = weeklyReportReady(
            { email: row.email, handle: row.handle, display_name: row.display_name },
            report
          );

          await sendEmail({
            to: row.email,
            subject: emailTemplate.subject,
            text: emailTemplate.text,
            html: emailTemplate.html,
          });
        }

        processed++;
      } catch (err) {
        failed++;
        // ПРАВИЛЬНИЙ СИГНАТУРНИЙ ВИКЛИК PINO: об'єкт завжди першим!
        logger.warn(
          "Weekly report failed for user",
          {
            requestId,
            handle: row.handle,
            challengeId: row.challenge_id,
            error: err instanceof Error ? err.message : String(err),
          }
        );
      }
    }

    logger.info(
      "Weekly coach cron completed",
      {
        requestId,
        processed,
        failed,
        weekStart: weekStart.toISOString().split("T")[0],
      }
    );
    return NextResponse.json({
      processed,
      weekStart: weekStart.toISOString().split("T")[0],
    });
  } catch (error: any) {
    logger.error(
      "Weekly coach cron failed critically",
      {
        requestId,
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
