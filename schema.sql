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

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  proofs_submitted INTEGER NOT NULL DEFAULT 0,
  avg_score NUMERIC(5,2),
  top_score INTEGER,
  consistency_pct NUMERIC(5,2),
  ai_summary TEXT NOT NULL,
  ai_strengths TEXT NOT NULL,
  ai_gaps TEXT NOT NULL,
  ai_recommendation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_skill_category ON challenges(skill_category);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON weekly_reports(user_id, week_start DESC);