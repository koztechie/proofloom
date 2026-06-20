/**
 * lib/dynamo/weekly-reader.ts
 *
 * Operations to read weekly proofs for AI coach report generation.
 */

import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { sendWithRetry } from "./client";
import { TABLE_NAME, Keys } from "./schema";

export interface ProofEntry {
  date: string;
  proofText: string;
  aiScore: number;
  aiComment: string;
  streakDay: number;
}

// Format date without time zone shifts
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

  const result = await sendWithRetry(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND sk BETWEEN :start AND :end",
      ExpressionAttributeValues: {
        ":pk": Keys.proofPk(handle),
        ":start": Keys.proofSk(startStr),
        ":end": Keys.proofSk(endStr),
      },
    }),
  );

  return (result.Items || []).map((item: Record<string, any>) => ({
    date: String(item.sk).replace("PROOF#", ""),
    // Provide both new format fields and fallback to snake_case just in case old records exist
    proofText: String(item.proofText ?? item.proof_text ?? ""),
    aiScore: Number(item.aiScore ?? item.ai_score ?? 50),
    aiComment: String(item.aiComment ?? item.ai_comment ?? ""),
    streakDay: Number(item.streakDay ?? item.streak_day ?? 0),
  }));
}
