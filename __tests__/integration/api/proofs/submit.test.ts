import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/proofs/submit/route";
import { NextRequest } from "next/server";
import { userFactory, challengeFactory } from "../../../fixtures";
import { auth } from "@/lib/auth";
import { docClient } from "@/lib/dynamo/client";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/dynamo/client", () => ({
  docClient: {
    send: vi.fn().mockResolvedValue({}),
  },
  sendWithRetry: vi.fn().mockImplementation(async (cmd) => {
    return { Items: [], Item: { tokens: 5, last_refill: Date.now() } };
  }),
}));

describe("POST /api/proofs/submit", () => {
  let user: any;
  let challenge: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    user = await userFactory();
    challenge = await challengeFactory(user.id);
    (auth as any).mockResolvedValue({
      user: { id: user.id, handle: user.handle, role: "USER", isActive: true }
    });
  });

  it("should submit a proof successfully and log to DynamoDB", async () => {
    const req = new NextRequest("http://localhost/api/proofs/submit", {
      method: "POST",
      body: JSON.stringify({
        challengeId: challenge.id,
        proofText: "Did my practice today and successfully completed three very long and complex exercises to demonstrate real effort.",
        proofUrl: "http://example.com"
      }),
      headers: { "Content-Type": "application/json" }
    });

    const res = await POST(req, {});
    const data = await res.json();
    
    expect(res.status).toBe(201);
    expect(data.data).toHaveProperty("score");
    expect(data.data.score).toBeDefined();
    
    // Check DynamoDB was called for rate limit
    expect(docClient.send).toHaveBeenCalled();
  });

  it("should reject due to rate limiting if bucket is empty", async () => {
    // Mock docClient to simulate rate limit (ConditionalCheckFailedException or similar)
    // Actually, we can just mock isRateLimited, or let the mock return false then true.
    // For simplicity, we just mock the exact docClient behavior for a rate limited request:
    // (return 0 tokens and zero elapsed time)
    (docClient.send as any).mockResolvedValueOnce({
      Item: { tokens: 0, last_refill: Date.now() }
    });

    const req = new NextRequest("http://localhost/api/proofs/submit", {
      method: "POST",
      body: JSON.stringify({ challengeId: challenge.id, proofText: "Did my practice today and successfully completed three very long and complex exercises to demonstrate real effort." }),
      headers: { "Content-Type": "application/json" }
    });

    const res = await POST(req, {});
    expect(res.status).toBe(429);
  });
});
