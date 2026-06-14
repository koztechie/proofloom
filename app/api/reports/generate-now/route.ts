import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db/client";
import { generateAndSaveWeeklyReport } from "@/lib/reports/generator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Перевірка сесії
    const session = await auth();
    if (!session?.user?.id || !session?.user?.handle) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Розраховуємо дату початку поточного тижня (останній понеділок)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    // 3. Шукаємо хоча б один активний публічний челендж цього юзера в Aurora PG
    const { rows } = await pool.query(
      `
      SELECT id, skill_category, title
      FROM challenges
      WHERE user_id = $1 AND is_public = TRUE AND streak_broken_at IS NULL
      LIMIT 1
    `,
      [session.user.id],
    );

    if (!rows.length) {
      return NextResponse.json(
        {
          error:
            "No active public challenge found. Please create a challenge and submit a proof first.",
        },
        { status: 400 },
      );
    }

    // 4. Запускаємо ШІ-аналіз за останні 7 днів і зберігаємо в базу
    await generateAndSaveWeeklyReport(
      session.user.id,
      session.user.handle,
      rows[0].id,
      rows[0].skill_category,
      rows[0].title,
      weekStart,
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Manual trigger report generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
