import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";

export interface ProofEntry {
  date: string;
  proofText: string;
  aiScore: number;
  aiComment: string;
  streakDay: number;
}

// Антикрихкість: форматуємо дату без зсувів часового поясу ISO
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getWeeklyProofs(
  handle: string,
  weekStart: Date,
): Promise<ProofEntry[]> {
  const startStr = formatDate(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  const endStr = formatDate(endDate);

  const result = await docClient.send(
    new QueryCommand({
      TableName: "StreakProofs",
      // Використовуємо лексикографічний BETWEEN на сорт-ключі для миттєвого пошуку
      KeyConditionExpression: "pk = :pk AND sk BETWEEN :start AND :end",
      ExpressionAttributeValues: {
        ":pk": `USER#${handle}`,
        ":start": `PROOF#${startStr}`,
        ":end": `PROOF#${endStr}`,
      },
    }),
  );

  return (result.Items || []).map((item) => ({
    date: item.sk.replace("PROOF#", ""),
    proofText: item.proof_text,
    aiScore: item.ai_score ?? 50,
    aiComment: item.ai_comment ?? "",
    streakDay: item.streak_day ?? 0,
  }));
}
