/**
 * Drizzle ORM schema for ProofLoom
 * Mirrors the existing Aurora PostgreSQL tables + new proofs & leaderboard_entries tables.
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  index,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  handle: text("handle").unique().notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  location: text("location"),
  websiteUrl: text("website_url"),
  twitterUrl: text("twitter_url"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  avatarType: text("avatar_type").default("initials").notNull(),
  /** RBAC role — maps to the Role enum in lib/auth/roles.ts */
  role: text("role").default("USER").notNull(),
  /** Soft-ban flag: false = account is suspended and cannot log in */
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`NOW()`,
  ),
});

// ---------------------------------------------------------------------------
// challenges
// ---------------------------------------------------------------------------
export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    skillCategory: text("skill_category").notNull(),
    targetDays: integer("target_days").default(30),
    startDate: date("start_date").default(sql`CURRENT_DATE`),
    isPublic: boolean("is_public").default(true),
    streakBrokenAt: timestamp("streak_broken_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`NOW()`,
    ),
  },
  (t) => [
    index("idx_challenges_user_id").on(t.userId),
    index("idx_challenges_skill_category").on(t.skillCategory),
  ],
);

// ---------------------------------------------------------------------------
// proofs  (migrated from DynamoDB per-user proof records into PG)
// ---------------------------------------------------------------------------
export const proofs = pgTable(
  "proofs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    url: text("url"),
    score: integer("score").default(0).notNull(),
    aiComment: text("ai_comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`NOW()`,
    ),
  },
  (t) => [index("idx_proofs_challenge_id").on(t.challengeId)],
);

// ---------------------------------------------------------------------------
// weekly_reports
// ---------------------------------------------------------------------------
export const weeklyReports = pgTable(
  "weekly_reports",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    weekEnd: date("week_end").notNull(),
    proofsSubmitted: integer("proofs_submitted").default(0).notNull(),
    avgScore: numeric("avg_score", { precision: 5, scale: 2 }),
    topScore: integer("top_score"),
    consistencyPct: numeric("consistency_pct", { precision: 5, scale: 2 }),
    aiSummary: text("ai_summary").notNull(),
    aiStrengths: text("ai_strengths").notNull(),
    aiGaps: text("ai_gaps").notNull(),
    aiRecommendation: text("ai_recommendation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`NOW()`,
    ),
  },
  (t) => [
    // Composite unique constraint kept in parity with schema.sql
    uniqueIndex("uq_weekly_reports_user_challenge_week").on(
      t.userId,
      t.challengeId,
      t.weekStart,
    ),
    // Covering index for dashboard queries sorted by week descending
    index("idx_weekly_reports_user_id").on(t.userId, t.weekStart),
  ],
);

// ---------------------------------------------------------------------------
// leaderboard_entries  (PG source-of-truth, DynamoDB used as read cache)
// ---------------------------------------------------------------------------
export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    totalScore: integer("total_score").default(0).notNull(),
    streakDays: integer("streak_days").default(0).notNull(),
    rank: integer("rank"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(
      sql`NOW()`,
    ),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.challengeId] }),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  challenges: many(challenges),
  proofs: many(proofs),
  weeklyReports: many(weeklyReports),
  leaderboardEntries: many(leaderboardEntries),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  user: one(users, { fields: [challenges.userId], references: [users.id] }),
  proofs: many(proofs),
  weeklyReports: many(weeklyReports),
  leaderboardEntries: many(leaderboardEntries),
}));

export const proofsRelations = relations(proofs, ({ one }) => ({
  challenge: one(challenges, {
    fields: [proofs.challengeId],
    references: [challenges.id],
  }),
  user: one(users, { fields: [proofs.userId], references: [users.id] }),
}));

export const weeklyReportsRelations = relations(weeklyReports, ({ one }) => ({
  user: one(users, {
    fields: [weeklyReports.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [weeklyReports.challengeId],
    references: [challenges.id],
  }),
}));

export const leaderboardEntriesRelations = relations(
  leaderboardEntries,
  ({ one }) => ({
    user: one(users, {
      fields: [leaderboardEntries.userId],
      references: [users.id],
    }),
    challenge: one(challenges, {
      fields: [leaderboardEntries.challengeId],
      references: [challenges.id],
    }),
  }),
);
