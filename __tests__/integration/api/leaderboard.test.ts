import { describe, test, expect } from "vitest";
import { userFactory, challengeFactory, proofFactory } from "../../fixtures";
import { getLeaderboard } from "@/lib/dynamo/leaderboard";

describe("Leaderboard Page API", () => {
  test("should return leaderboard sorted by score descending", async () => {
    const user1 = await userFactory();
    const user2 = await userFactory();

    const challenge1 = await challengeFactory({
      userId: user1.id,
      skillCategory: "SQL",
    });
    const challenge2 = await challengeFactory({
      userId: user2.id,
      skillCategory: "SQL",
    });

    await proofFactory({
      handle: user1.handle,
      challengeId: challenge1.id,
      aiScore: 90,
      skillCategory: "SQL",
    });
    await proofFactory({
      handle: user2.handle,
      challengeId: challenge2.id,
      aiScore: 95,
      skillCategory: "SQL",
    });

    const leaderboard = await getLeaderboard("SQL");
    expect(leaderboard.length).toBeGreaterThanOrEqual(2);
    expect(leaderboard[0]!.total_score).toBe(95); // Додано оператор ! для суворої типізації
    expect(leaderboard[1]!.total_score).toBe(90); // Додано оператор !
  });
});
