import { describe, it, expect, vi, beforeEach } from "vitest";
import { evaluateProof } from "@/lib/ai/evaluator";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

// Mock BedrockRuntimeClient
vi.mock("@aws-sdk/client-bedrock-runtime", () => {
  const sendMock = vi.fn();
  return {
    BedrockRuntimeClient: vi.fn(() => ({
      send: sendMock,
    })),
    InvokeModelCommand: vi.fn((args) => args),
  };
});

describe("Evaluator", () => {
  let sendMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const client = new BedrockRuntimeClient({});
    sendMock = client.send;
  });

  it("should parse robust JSON successfully when wrapped in markdown", async () => {
    const mockResponse = {
      body: new TextEncoder().encode(JSON.stringify({
        output: {
          message: {
            content: [{ text: "```json\n{\"score\": 85, \"comment\": \"Great job\"}\n```" }]
          }
        }
      }))
    };
    sendMock.mockResolvedValueOnce(mockResponse);

    const result = await evaluateProof("typescript", "Did some ts", "http://test.com");
    expect(result.score).toBe(85);
    expect(result.comment).toBe("Great job");
  });

  it("should fallback to heuristic logic if AWS Bedrock throws an error", async () => {
    sendMock.mockRejectedValueOnce(new Error("AWS Throttling"));

    const result = await evaluateProof("react", "I built a React component using hooks and API integration.", "http://test.com");
    
    // React is tech (+15), has url (+10), length ~58 (+5). Total = 45+30 = 75
    expect(result.score).toBe(75);
    expect(result.comment).toContain("Good progress");
  });

  it("should sanitize and cap score bounds between 0 and 100", async () => {
    const mockResponse = {
      body: new TextEncoder().encode(JSON.stringify({
        output: {
          message: {
            content: [{ text: "{\"score\": 150, \"comment\": \"Too high\"}" }]
          }
        }
      }))
    };
    sendMock.mockResolvedValueOnce(mockResponse);

    const result = await evaluateProof("typescript", "short text", "");
    expect(result.score).toBe(100);
  });
});
