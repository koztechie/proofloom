import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/leaderboard/route";
import { NextRequest } from "next/server";
import { userFactory, challengeFactory, proofFactory } from "../../fixtures";

describe("GET /api/leaderboard", () => {
  beforeEach(async () => {
    // Seed test data
    const user1 = await userFactory();
    const challenge1 = await challengeFactory(user1.id, { skillCategory: "golang" });
    await proofFactory(user1.id, challenge1.id, { score: 50 });

    const user2 = await userFactory();
    const challenge2 = await challengeFactory(user2.id, { skillCategory: "golang" });
    await proofFactory(user2.id, challenge2.id, { score: 90 });
  });

  it("should return leaderboard sorted by score descending", async () => {
    const req = new NextRequest("http://localhost/api/leaderboard?category=golang");
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.entries).toBeInstanceOf(Array);
    expect(data.entries.length).toBeGreaterThanOrEqual(2);
    
    // Highest score should be first
    expect(data.entries[0].totalScore).toBeGreaterThanOrEqual(data.entries[1].totalScore);
  });
});
