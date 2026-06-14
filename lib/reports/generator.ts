import { getWeeklyProofs } from "../dynamo/weekly-reader";
import { generateWeeklyReport } from "../ai/weekly-coach";
import pool from "../db/client";

// Допоміжна функція форматування дати без зсувів часового поясу ISO
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function generateAndSaveWeeklyReport(
  userId: string,
  userHandle: string,
  challengeId: string,
  skillCategory: string,
  challengeTitle: string,
  weekStart: Date,
): Promise<void> {
  // 1. Зчитуємо звіти за поточний тиждень з NoSQL DynamoDB [E4]
  const proofs = await getWeeklyProofs(userHandle, weekStart);

  // Якщо активності за тиждень не було — тихо пропускаємо [E4]
  if (proofs.length === 0) return;

  // 2. Рахуємо аналітичні метрики [E4]
  const avgScore = proofs.reduce((s, p) => s + p.aiScore, 0) / proofs.length;
  const topScore = Math.max(...proofs.map((p) => p.aiScore));
  const consistency = (proofs.length / 7) * 100;

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // 3. Генеруємо аналітику від ШІ-коуча через Bedrock Nova Lite [E4]
  const report = await generateWeeklyReport({
    skillCategory,
    challengeTitle,
    proofs,
    avgScore,
    consistency,
  });

  // 4. Зберігаємо (UPSERT) у реляційну базу Aurora PostgreSQL [E4]
  await pool.query(
    `
    INSERT INTO weekly_reports (
      user_id, challenge_id, week_start, week_end,
      proofs_submitted, avg_score, top_score, consistency_pct,
      ai_summary, ai_strengths, ai_gaps, ai_recommendation
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (user_id, challenge_id, week_start)
    DO UPDATE SET
      proofs_submitted = EXCLUDED.proofs_submitted,
      avg_score = EXCLUDED.avg_score,
      top_score = EXCLUDED.top_score,
      consistency_pct = EXCLUDED.consistency_pct,
      ai_summary = EXCLUDED.ai_summary,
      ai_strengths = EXCLUDED.ai_strengths,
      ai_gaps = EXCLUDED.ai_gaps,
      ai_recommendation = EXCLUDED.ai_recommendation
  `,
    [
      userId,
      challengeId,
      formatDate(weekStart),
      formatDate(weekEnd),
      proofs.length,
      avgScore,
      topScore,
      consistency,
      report.summary,
      report.strengths,
      report.gaps,
      report.recommendation,
    ],
  );
}
