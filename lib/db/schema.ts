/**
 * Drizzle ORM schema for ProofLoom
 * Mirrors the existing Aurora PostgreSQL tables + new proofs & leaderboard_entries tables.
 */

import {
  pgTable,
  pgSchema,
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
  check,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// КРИТИЧНО: Для тестів явно використовуємо схему proofloom_test.
// Це усуває race condition з search_path через pg.Pool, бо drizzle генерує
// SQL з повним префіксом схеми ("proofloom_test"."users") замість покладання
// на search_path. У production залишається public (default schema).
const isTest = process.env.NODE_ENV === "test";
const table = (isTest ? pgSchema("proofloom_test").table : pgTable) as typeof pgTable;

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = table(
  "users",
  {
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
  },
  (t) => [
    check("users_role_check", sql`${t.role} IN ('USER', 'ADMIN', 'MODERATOR')`),
  ],
);

// ---------------------------------------------------------------------------
// challenges
// ---------------------------------------------------------------------------
export const challenges = table(
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
    check(
      "challenges_target_days_check",
      sql`${t.targetDays} BETWEEN 7 AND 365`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// proofs  (migrated from DynamoDB per-user proof records into PG)
// ---------------------------------------------------------------------------
export const proofs = table(
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
  (t) => [
    index("idx_proofs_challenge_id").on(t.challengeId),
    index("idx_proofs_user_id").on(t.userId),
    index("idx_proofs_created_at").on(t.createdAt),
    check("proofs_score_check", sql`${t.score} BETWEEN 0 AND 100`),
  ],
);

// ---------------------------------------------------------------------------
// weekly_reports
// ---------------------------------------------------------------------------
export const weeklyReports = table(
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
    uniqueIndex("uq_weekly_reports_user_challenge_week").on(
      t.userId,
      t.challengeId,
      t.weekStart,
    ),
    index("idx_weekly_reports_user_id").on(t.userId, t.weekStart),
  ],
);

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
export const notifications = table(
  "notifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    priority: text("priority").default("normal").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`NOW()`,
    ),
  },
  (t) => [
    index("idx_notifications_user_id").on(t.userId),
    index("idx_notifications_is_read").on(t.isRead),
  ],
);

// ---------------------------------------------------------------------------
// leaderboard_entries  (PG source-of-truth, DynamoDB used as read cache)
// ---------------------------------------------------------------------------
export const leaderboardEntries = table(
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
    index("idx_leaderboard_entries_rank").on(t.rank),
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
  notifications: many(notifications),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
