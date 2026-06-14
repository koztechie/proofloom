import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/client";
import { generateAndSaveWeeklyReport } from "@/lib/reports/generator";

// КРИТИЧНО: Забороняємо кешування результатів крону на серверах Vercel
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Захист за допомогою секрету (Vercel передає цей хедер автоматично)
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Розраховуємо дату минулого понеділка (week_start) [E5]
  // Якщо сьогодні неділя, 14 червня, то weekStart буде понеділком, 1 червня.
  // Це забезпечує аналіз повністю закритих звітів за позаминулий тиждень (Monday-Sunday).
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
  weekStart.setHours(0, 0, 0, 0);

  try {
    // 3. Витягуємо всі активні публічні челенджі з Aurora PostgreSQL [E5]
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

    // 4. Запускаємо генерацію звітів для кожного челенджу
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
        // Антикрихкість: один збій (наприклад, у лімітах конкретного користувача)
        // не повинен блокувати генерацію звітів для решти бази [E5]
        console.error(
          `Failed to generate weekly report for ${row.handle}:`,
          err,
        );
      }
    }

    return NextResponse.json({
      processed,
      weekStart: weekStart.toISOString().split("T")[0],
    });
  } catch (error: any) {
    console.error("Weekly Coach Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
