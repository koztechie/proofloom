import { setupTestDb } from "./__tests__/utils/test-db.ts";
import pool from "./lib/db/client.ts";

async function run() {
  await setupTestDb();
  try {
    const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'proofloom_test' AND contype = 'f';
    `);
    console.log(res.rows);
  } finally {
    await pool.end();
  }
}
run();
