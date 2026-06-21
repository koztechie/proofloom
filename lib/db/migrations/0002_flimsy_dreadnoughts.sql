CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW()
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_leaderboard_entries_rank" ON "leaderboard_entries" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "idx_proofs_user_id" ON "proofs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_proofs_created_at" ON "proofs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_target_days_check" CHECK ("challenges"."target_days" BETWEEN 7 AND 365);--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_score_check" CHECK ("proofs"."score" BETWEEN 0 AND 100);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("users"."role" IN ('USER', 'ADMIN', 'MODERATOR'));