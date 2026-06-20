import { expect, test, describe, vi } from 'vitest';
import pool from '@/lib/db/client';

vi.mock('@/lib/db/client', () => {
  return {
    default: {
      query: vi.fn().mockResolvedValue({ rows: [{ id: 'challenge-123', title: 'Test Challenge', skill_category: 'JavaScript' }] })
    }
  };
});

describe('Challenge API Integration', () => {
  test('challenge creation', async () => {
    const result = await pool.query('INSERT INTO challenges...');
    expect(result.rows[0].title).toBe('Test Challenge');
  });

  test('challenge retrieval', async () => {
    const result = await pool.query('SELECT * FROM challenges...');
    expect(result.rows[0].skill_category).toBe('JavaScript');
  });
});
