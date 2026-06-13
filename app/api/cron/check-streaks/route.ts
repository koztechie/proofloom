import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/client";
import { getCurrentStreak } from "@/lib/dynamo/streaks";

// КРИТИЧНО: Забороняємо кешування цього роуту
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Захист від неавторизованих викликів (Vercel передає цей хедер автоматично)
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Отримуємо всіх користувачів з бази
    const { rows: users } = await pool.query("SELECT id, handle FROM users;");
    let brokenCount = 0;

    // 3. Перевіряємо стрік для кожного користувача
    for (const user of users) {
      // getCurrentStreak динамічно рахує стрік з DynamoDB. Якщо 0 — стрік перервано.
      const currentStreak = await getCurrentStreak(user.handle);

      if (currentStreak === 0) {
        // Позначаємо всі їхні активні челенджі як "спалені"
        const updateQuery = `
          UPDATE challenges 
          SET streak_broken_at = NOW() 
          WHERE user_id = $1 AND streak_broken_at IS NULL
        `;
        const res = await pool.query(updateQuery, [user.id]);
        brokenCount += res.rowCount || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron executed successfully. Marked ${brokenCount} challenges as broken.`,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
