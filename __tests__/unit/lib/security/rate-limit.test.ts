import { expect, test, describe, vi } from 'vitest';
import { isRateLimited } from '@/lib/security/rate-limit';
import { docClient } from '@/lib/dynamo/client';

vi.mock('@/lib/dynamo/client', () => {
  return {
    docClient: {
      send: vi.fn().mockResolvedValue({}),
    },
  };
});

describe('Rate Limiter', () => {
  test('allows requests within limit', async () => {
    const limited = await isRateLimited('johndoe', 5, 60);
    expect(limited).toBe(false);
  });
});
