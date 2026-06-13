import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";

export interface ProofRecord {
  pk: string;
  sk: string;
  challenge_id: string;
  proof_text: string;
  proof_url: string | null;
  streak_day: number;
  ai_score: number;
  ai_comment: string;
  submitted_at: string;
}

export async function submitProof(params: {
  handle: string;
  challengeId: string;
  proofText: string;
  proofUrl?: string;
  streakDay: number;
  aiScore: number;
  aiComment: string;
}): Promise<void> {
  // Визначаємо поточну дату в часовому поясі сервера (формат YYYY-MM-DD)
  const date = new Date().toISOString().split("T")[0];

  await docClient.send(
    new PutCommand({
      TableName: "StreakProofs",
      Item: {
        pk: `USER#${params.handle}`,
        sk: `PROOF#${date}`,
        challenge_id: params.challengeId,
        proof_text: params.proofText,
        proof_url: params.proofUrl || null,
        streak_day: params.streakDay,
        ai_score: params.aiScore,
        ai_comment: params.aiComment,
        submitted_at: new Date().toISOString(),
      },
    }),
  );
}

export async function getProofsByHandle(
  handle: string,
): Promise<ProofRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: "StreakProofs",
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${handle}`,
        ":prefix": "PROOF#",
      },
      ScanIndexForward: false, // Отримуємо найновіші записи першими (LIFO)
    }),
  );

  return (result.Items as ProofRecord[]) || [];
}
