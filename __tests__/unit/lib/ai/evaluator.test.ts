import { describe, test, expect, vi, beforeEach } from "vitest";
import { evaluateProof } from "@/lib/ai/evaluator";

// Створюємо глобальну мок-функцію для методу send, використовуючи vi.hoisted
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("@aws-sdk/client-bedrock-runtime", () => {
  class MockBedrockRuntimeClient {
    send = mockSend;
  }
  class MockInvokeModelCommand {
    constructor(public args: any) {}
  }
  return {
    BedrockRuntimeClient: MockBedrockRuntimeClient,
    InvokeModelCommand: MockInvokeModelCommand,
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
    expect(result.score).toBe(47);
    expect(result.comment).toContain("Basic submission");
  });
});
