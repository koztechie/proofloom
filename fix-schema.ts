import pool from "./lib/db/client.ts";

async function fixConstraints() {
  const queries = [
    `ALTER TABLE proofloom_test.challenges DROP CONSTRAINT IF EXISTS challenges_user_id_users_id_fk;`,
    `ALTER TABLE proofloom_test.challenges ADD CONSTRAINT challenges_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES proofloom_test.users(id) ON DELETE CASCADE;`,

    `ALTER TABLE proofloom_test.leaderboard_entries DROP CONSTRAINT IF EXISTS leaderboard_entries_user_id_users_id_fk;`,
    `ALTER TABLE proofloom_test.leaderboard_entries ADD CONSTRAINT leaderboard_entries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES proofloom_test.users(id) ON DELETE CASCADE;`,

    `ALTER TABLE proofloom_test.leaderboard_entries DROP CONSTRAINT IF EXISTS leaderboard_entries_challenge_id_challenges_id_fk;`,
    `ALTER TABLE proofloom_test.leaderboard_entries ADD CONSTRAINT leaderboard_entries_challenge_id_challenges_id_fk FOREIGN KEY (challenge_id) REFERENCES proofloom_test.challenges(id) ON DELETE CASCADE;`,

    `ALTER TABLE proofloom_test.proofs DROP CONSTRAINT IF EXISTS proofs_challenge_id_challenges_id_fk;`,
    `ALTER TABLE proofloom_test.proofs ADD CONSTRAINT proofs_challenge_id_challenges_id_fk FOREIGN KEY (challenge_id) REFERENCES proofloom_test.challenges(id) ON DELETE CASCADE;`,

    `ALTER TABLE proofloom_test.proofs DROP CONSTRAINT IF EXISTS proofs_user_id_users_id_fk;`,
    `ALTER TABLE proofloom_test.proofs ADD CONSTRAINT proofs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES proofloom_test.users(id) ON DELETE CASCADE;`,

    `ALTER TABLE proofloom_test.weekly_reports DROP CONSTRAINT IF EXISTS weekly_reports_user_id_users_id_fk;`,
    `ALTER TABLE proofloom_test.weekly_reports ADD CONSTRAINT weekly_reports_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES proofloom_test.users(id) ON DELETE CASCADE;`,

    `ALTER TABLE proofloom_test.weekly_reports DROP CONSTRAINT IF EXISTS weekly_reports_challenge_id_challenges_id_fk;`,
    `ALTER TABLE proofloom_test.weekly_reports ADD CONSTRAINT weekly_reports_challenge_id_challenges_id_fk FOREIGN KEY (challenge_id) REFERENCES proofloom_test.challenges(id) ON DELETE CASCADE;`,

    `ALTER TABLE proofloom_test.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_users_id_fk;`,
    `ALTER TABLE proofloom_test.notifications ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES proofloom_test.users(id) ON DELETE CASCADE;`,
  ];

  for (const q of queries) {
    try {
      await pool.query(q);
      console.log("Executed:", q);
    } catch (e) {
      console.error("Failed:", q, e.message);
    }
  }
  await pool.end();
}
fixConstraints();
