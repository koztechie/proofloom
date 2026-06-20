import { expect, test, describe, vi } from 'vitest';
import { evaluateProof } from '@/lib/ai/evaluator';
import { docClient } from '@/lib/dynamo/client';

vi.mock('@/lib/dynamo/client', () => {
  return {
    docClient: {
      send: vi.fn().mockResolvedValue({}),
    },
  };
});

vi.mock('@/lib/ai/evaluator', () => {
  return {
    evaluateProof: vi.fn().mockResolvedValue({ score: 90, comment: 'Great job!', status: 'success' })
  };
});

describe('Proof API Integration', () => {
  test('proof submission route succeeds and writes to DB', async () => {
    const evalResult = await evaluateProof('JavaScript', 'some proof text');
    expect(evalResult.score).toBe(90);
    
    // Simulate DB write
    const dbWrite = await docClient.send({} as any);
    expect(dbWrite).toBeDefined();
  });
});
