import { describe, test, expect, vi, beforeEach } from "vitest";
import { evaluateProof } from "@/lib/ai/evaluator";

// Створюємо глобальну мок-функцію для методу send
const mockSend = vi.fn();

vi.mock("@aws-sdk/client-bedrock-runtime", () => {
  return {
    BedrockRuntimeClient: vi.fn().mockImplementation(() => {
      return {
        send: mockSend,
      };
    }),
    InvokeModelCommand: vi.fn().mockImplementation((args) => args),
  };
});

describe("Bedrock Evaluator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("successfully evaluates proof and parses JSON", async () => {
    // Симулюємо успішну відповідь від Bedrock Nova Lite
    const mockResponse = {
      body: new TextEncoder().encode(
        JSON.stringify({
          output: {
            message: {
              content: [
                {
                  text: JSON.stringify({
                    score: 90,
                    comment: "Excellent work.",
                  }),
                },
              ],
            },
          },
        }),
      ),
    };
    mockSend.mockResolvedValueOnce(mockResponse);

    const result = await evaluateProof(
      "SQL",
      "Wrote joins, aggregate functions and tested plans.",
    );
    expect(result.score).toBe(90);
    expect(result.comment).toBe("Excellent work.");
  });

  test("gracefully falls back to mock score on Bedrock runtime errors", async () => {
    // Симулюємо помилку карантину або мережі (ValidationException)
    mockSend.mockRejectedValueOnce(
      new Error("ValidationException: Operation not allowed"),
    );

    const result = await evaluateProof("SQL", "Some test proof text.");
    expect(result.score).toBe(85);
    expect(result.comment).toContain("AI evaluation temporarily unavailable");
  });
});
