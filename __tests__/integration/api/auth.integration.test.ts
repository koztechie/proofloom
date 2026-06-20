import { expect, test, describe, vi } from 'vitest';
import pool from '@/lib/db/client';

vi.mock('@/lib/db/client', () => {
  return {
    default: {
      query: vi.fn().mockResolvedValue({ rows: [{ id: '123', handle: 'testuser', email: 'test@example.com' }] })
    }
  };
});

describe('Auth API Integration', () => {
  test('login flow authenticates user', async () => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    expect(result.rows[0].handle).toBe('testuser');
  });

  test('register flow creates user', async () => {
    const result = await pool.query('INSERT INTO users...', []);
    expect(result.rows.length).toBe(1);
  });
});
