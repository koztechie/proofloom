CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"skill_category" text NOT NULL,
	"target_days" integer DEFAULT 30,
	"start_date" date DEFAULT CURRENT_DATE,
	"is_public" boolean DEFAULT true,
	"streak_broken_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "leaderboard_entries" (
	"user_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"updated_at" timestamp with time zone DEFAULT NOW(),
	CONSTRAINT "leaderboard_entries_user_id_challenge_id_pk" PRIMARY KEY("user_id","challenge_id")
);
--> statement-breakpoint
CREATE TABLE "proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"url" text,
	"score" integer DEFAULT 0 NOT NULL,
	"ai_comment" text,
	"created_at" timestamp with time zone DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"bio" text,
	"avatar_url" text,
	"location" text,
	"website_url" text,
	"twitter_url" text,
	"github_url" text,
	"linkedin_url" text,
	"avatar_type" text DEFAULT 'initials' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW(),
	CONSTRAINT "users_handle_unique" UNIQUE("handle"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"week_end" date NOT NULL,
	"proofs_submitted" integer DEFAULT 0 NOT NULL,
	"avg_score" numeric(5, 2),
	"top_score" integer,
	"consistency_pct" numeric(5, 2),
	"ai_summary" text NOT NULL,
	"ai_strengths" text NOT NULL,
	"ai_gaps" text NOT NULL,
	"ai_recommendation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW()
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_challenges_user_id" ON "challenges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_challenges_skill_category" ON "challenges" USING btree ("skill_category");--> statement-breakpoint
CREATE INDEX "idx_proofs_challenge_id" ON "proofs" USING btree ("challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_weekly_reports_user_challenge_week" ON "weekly_reports" USING btree ("user_id","challenge_id","week_start");--> statement-breakpoint
CREATE INDEX "idx_weekly_reports_user_id" ON "weekly_reports" USING btree ("user_id","week_start");