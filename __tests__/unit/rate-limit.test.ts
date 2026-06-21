import { describe, it, expect, vi, beforeEach } from "vitest";
import { isRateLimited } from "@/lib/security/rate-limit";
import { docClient } from "@/lib/dynamo/client";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

vi.mock("@/lib/dynamo/client", () => {
  return {
    docClient: {
      send: vi.fn(),
    },
  };
});

describe("Rate Limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow first time request and initialize bucket", async () => {
    (docClient.send as any).mockResolvedValueOnce({}); // GetCommand returns empty
    (docClient.send as any).mockResolvedValueOnce({}); // PutCommand succeeds

    const limited = await isRateLimited("test_ip", 10, 60);
    expect(limited).toBe(false);
  });

  it("should allow request and decrement token if bucket is partially full", async () => {
    (docClient.send as any).mockResolvedValueOnce({
      Item: {
        tokens: 5,
        last_refill: Date.now(), // just refilled
      }
    });
    (docClient.send as any).mockResolvedValueOnce({}); // UpdateCommand succeeds

    const limited = await isRateLimited("test_ip", 10, 60);
    expect(limited).toBe(false);
  });

  it("should deny request if bucket is empty and no time elapsed", async () => {
    (docClient.send as any).mockResolvedValueOnce({
      Item: {
        tokens: 0,
        last_refill: Date.now(), // zero time elapsed
      }
    });

    const limited = await isRateLimited("test_ip", 10, 60);
    expect(limited).toBe(true);
  });

  it("should treat request as rate limited if optimistic locking fails", async () => {
    (docClient.send as any).mockResolvedValueOnce({
      Item: {
        tokens: 5,
        last_refill: Date.now(),
      }
    });
    // Simulate concurrent modification
    (docClient.send as any).mockRejectedValueOnce(
      new ConditionalCheckFailedException({ message: "Condition failed", $metadata: {} })
    );

    const limited = await isRateLimited("test_ip", 10, 60);
    expect(limited).toBe(true);
  });
});
