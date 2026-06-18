export interface User {
  id: string;
  handle: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  avatar_type: string;
  /** RBAC role string (maps to Role enum). Defaults to "USER". */
  role: string;
  /** Soft-ban flag — false means the account is suspended. */
  is_active: boolean;
  created_at: Date;
}

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  skill_category: string;
  target_days: number;
  start_date: string | null;
  is_public: boolean;
  streak_broken_at: Date | null;
  created_at: Date;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  challenge_id: string;
  week_start: string | Date;
  week_end: string | Date;
  proofs_submitted: number;
  avg_score: number | null;
  top_score: number | null;
  consistency_pct: number | null;
  ai_summary: string;
  ai_strengths: string;
  ai_gaps: string;
  ai_recommendation: string;
  created_at: Date;
}

export interface Proof {
  pk: string;
  sk: string;
  challenge_id: string;
  proof_text: string;
  proof_url: string | null;
  streak_day: number;
  ai_score: number;
  ai_comment: string;
  submitted_at: string;
}
