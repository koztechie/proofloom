/**
 * lib/dynamo/types.ts
 *
 * Strictly-typed Single-Table Design entity definitions for DynamoDB.
 *
 * Every entity stored in the table extends DynamoEntity<T> which carries the
 * base GSI keys and audit timestamps. The payload type T provides the
 * domain-specific fields.
 *
 * Naming convention for entity types:
 *   - *Entity  → the raw DynamoDB item shape (stored form)
 *   - *Payload → the domain fields carried inside the entity
 */

// ── Base entity ─────────────────────────────────────────────────────────────

/**
 * Base shape for every item in the StreakProofs table.
 *
 * @template T  Domain-specific payload fields merged into the item.
 */
export interface DynamoEntity<T> {
  /** Primary partition key. */
  pk: string;
  /** Primary sort key. */
  sk: string;
  /** GSI1 partition key (optional — not all entities use GSI1). */
  gsi1pk?: string;
  /** GSI1 sort key. */
  gsi1sk?: string;
  /** GSI2 partition key (optional — not all entities use GSI2). */
  gsi2pk?: string;
  /** GSI2 sort key. */
  gsi2sk?: string;
  /** Discriminator for entity type (enables polymorphic queries). */
  entityType: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-update timestamp. */
  updatedAt: string;
  /** DynamoDB TTL epoch-second (optional — set per entity type). */
  ttl?: number;
  /** Domain payload merged at the top level for DynamoDB efficiency. */
  payload: T;
}

// ── ProofEntity ─────────────────────────────────────────────────────────────

export interface ProofPayload {
  /** UUID of the challenge this proof belongs to. */
  challengeId: string;
  /** Free-text body of the proof written by the user. */
  proofText: string;
  /** Optional URL to supporting evidence (GitHub, video, etc.). */
  proofUrl: string | null;
  /** Which consecutive day of the challenge streak this proof represents. */
  streakDay: number;
  /** AI-assigned quality score (0–100). */
  aiScore: number;
  /** AI-generated textual feedback on the proof. */
  aiComment: string;
  /** Internal user UUID (used by GSI2 queries). */
  userId: string;
}

/**
 * DynamoDB item for a daily proof submission.
 *
 * pk      = USER#<handle>
 * sk      = PROOF#<YYYY-MM-DD>
 * gsi1pk  = CHALLENGE#<challengeId>       (challenge-based queries)
 * gsi1sk  = PROOF#<YYYY-MM-DD>
 * gsi2pk  = USER_ID#<userId>              (user-UUID-based queries)
 * gsi2sk  = PROOF#<YYYY-MM-DD>
 */
export type ProofEntity = DynamoEntity<ProofPayload> & {
  entityType: "PROOF";
  gsi1pk: string;
  gsi1sk: string;
  gsi2pk: string;
  gsi2sk: string;
};

// ── LeaderboardEntryEntity ──────────────────────────────────────────────────

export interface LeaderboardPayload {
  /** The user's public handle. */
  handle: string;
  /** The skill category this score belongs to. */
  category: string;
  /** Running total of AI scores across all proofs in this category. */
  totalScore: number;
}

/**
 * DynamoDB item for a leaderboard entry.
 *
 * pk = LEADERBOARD
 * sk = SCORE#<handle>#<category>
 */
export type LeaderboardEntryEntity = DynamoEntity<LeaderboardPayload> & {
  entityType: "LEADERBOARD_ENTRY";
};

// ── StreakEntity ────────────────────────────────────────────────────────────

export interface StreakPayload {
  /** The user's public handle. */
  handle: string;
  /** Current consecutive-day streak count. */
  currentStreak: number;
  /** All-time longest streak. */
  longestStreak: number;
  /** ISO date of the last proof submission ("YYYY-MM-DD"). */
  lastProofDate: string;
}

/**
 * DynamoDB item for a user's streak metadata.
 * Stored separately from proof items to allow O(1) streak reads.
 *
 * pk = USER#<handle>
 * sk = STREAK
 */
export type StreakEntity = DynamoEntity<StreakPayload> & {
  entityType: "STREAK";
};

// ── WeeklyReportEntity ──────────────────────────────────────────────────────

export interface WeeklyReportPayload {
  /** Internal user UUID. */
  userId: string;
  /** UUID of the challenge the report covers. */
  challengeId: string;
  /** ISO date of the Monday that starts the reported week. */
  weekStart: string;
  /** ISO date of the Sunday that ends the reported week. */
  weekEnd: string;
  /** Number of proofs submitted during the week. */
  proofsSubmitted: number;
  /** Average AI score for the week. */
  avgScore: number;
  /** Highest AI score achieved during the week. */
  topScore: number;
  /** Percentage of days with a proof (proofsSubmitted / 7 * 100). */
  consistencyPct: number;
  /** AI-generated summary paragraph. */
  aiSummary: string;
  /** AI-identified strengths. */
  aiStrengths: string;
  /** AI-identified gaps. */
  aiGaps: string;
  /** AI recommendation for next week. */
  aiRecommendation: string;
}

/**
 * DynamoDB item for a weekly AI-coach report.
 *
 * pk = USER#<handle>
 * sk = WEEKLY_REPORT#<weekStart>
 */
export type WeeklyReportEntity = DynamoEntity<WeeklyReportPayload> & {
  entityType: "WEEKLY_REPORT";
};

// ── Flat "legacy" view ──────────────────────────────────────────────────────

/**
 * The shape that legacy call-sites (dashboard, challenge page, user profile)
 * expect from getProofsByHandle(). Matches the existing "Proof" interface in
 * types/db.ts so the rest of the codebase requires zero changes.
 *
 * We return this view from the refactored DynamoDB functions to maintain
 * backward compatibility with all Server Components and API routes.
 */
export interface ProofView {
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

/** Flat view for leaderboard entries (matches existing LeaderboardEntry). */
export interface LeaderboardEntryView {
  handle: string;
  category: string;
  total_score: number;
}
