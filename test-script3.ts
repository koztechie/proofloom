import { setupTestDb } from "./__tests__/utils/test-db.ts";
import pool from "./lib/db/client.ts";

async function run() {
  await setupTestDb();
  try {
    const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conname = 'challenges_user_id_users_id_fk';
    `);
    console.log("Constraint:", res.rows);
  } finally {
    await pool.end();
  }
}
run();
