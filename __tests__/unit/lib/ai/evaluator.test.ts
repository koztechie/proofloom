import { expect, test, describe, vi } from 'vitest';
import { evaluateProof } from '@/lib/ai/evaluator';

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: vi.fn(() => ({
      send: vi.fn().mockRejectedValue(new Error('Bedrock failed')),
    })),
    InvokeModelCommand: vi.fn(),
  };
});

describe('AI Evaluator', () => {
  test('fallback mechanism on error returns score', async () => {
    const result = await evaluateProof('JavaScript', 'I wrote some cool code today! Here is the proof of my work.'.padEnd(50, ' '));
    expect(result.score).toBeDefined();
    expect(result.comment).toBeDefined();
  });
});
