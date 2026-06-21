import { setupTestDb } from "./__tests__/utils/test-db.ts";
import { userFactory } from "./__tests__/fixtures/index.ts";
import pool from "./lib/db/client.ts";

async function run() {
  await setupTestDb();
  try {
    const user = await userFactory();
    console.log("User created:", user.id);
    
    // Check public schema
    const resPublic = await pool.query("SELECT * FROM public.users WHERE id = $1", [user.id]);
    console.log("In public.users?", resPublic.rows.length > 0);
    
    // Check test schema
    const resTest = await pool.query("SELECT * FROM proofloom_test.users WHERE id = $1", [user.id]);
    console.log("In proofloom_test.users?", resTest.rows.length > 0);
  } finally {
    await pool.end();
  }
}
run();
