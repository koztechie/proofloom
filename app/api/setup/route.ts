import { NextResponse } from 'next/server';
import pool from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        handle TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        bio TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        skill_category TEXT NOT NULL,
        target_days INTEGER DEFAULT 30,
        start_date DATE DEFAULT CURRENT_DATE,
        is_public BOOLEAN DEFAULT TRUE,
        streak_broken_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
      CREATE INDEX IF NOT EXISTS idx_challenges_skill_category ON challenges(skill_category);
    `;

    await pool.query(sql);
    return NextResponse.json({ success: true, message: 'Database schema successfully applied!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}