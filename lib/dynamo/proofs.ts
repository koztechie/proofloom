import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
  skillCategory?: string; // Додано для запису в лідерборд
}): Promise<void> {
  const date = new Date().toISOString().split("T")[0];

  // 1. Зберігаємо сам звіт
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

  // 2. Одночасно оновлюємо лідерборд (Atomic Increment)
  if (params.skillCategory) {
    await docClient.send(
      new UpdateCommand({
        TableName: "StreakProofs",
        Key: {
          pk: "LEADERBOARD",
          sk: `SCORE#${params.handle}#${params.skillCategory}`,
        },
        // ADD автоматично додає число до існуючого (або створює, якщо його нема)
        UpdateExpression:
          "ADD total_score :score SET handle = :handle, #cat = :cat",
        ExpressionAttributeNames: { "#cat": "category" }, // Захист від зарезервованих слів
        ExpressionAttributeValues: {
          ":score": params.aiScore,
          ":handle": params.handle,
          ":cat": params.skillCategory,
        },
      }),
    );
  }
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
      ScanIndexForward: false,
    }),
  );

  return (result.Items as ProofRecord[]) || [];
}
