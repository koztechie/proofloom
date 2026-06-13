import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";

export interface LeaderboardEntry {
  handle: string;
  category: string;
  total_score: number;
}

export async function getLeaderboard(
  skillCategory?: string,
  limit = 20,
): Promise<LeaderboardEntry[]> {
  // Витягуємо всі скоринг-записи з партиції лідерборду
  const result = await docClient.send(
    new QueryCommand({
      TableName: "StreakProofs",
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": "LEADERBOARD",
        ":prefix": "SCORE#",
      },
    }),
  );

  let items = (result.Items || []) as LeaderboardEntry[];

  // Фільтрація по категорії (якщо вибрана не All)
  if (skillCategory && skillCategory !== "All") {
    items = items.filter((item) => item.category === skillCategory);
  }

  // Сортування в пам'яті (від найбільшого бала до найменшого)
  items.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

  return items.slice(0, limit);
}
