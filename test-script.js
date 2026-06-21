import { setupTestDb } from "./__tests__/utils/test-db.js";
import { userFactory, challengeFactory } from "./__tests__/fixtures/index.js";
import pool from "./lib/db/client.js";

async function run() {
  await setupTestDb();
  console.log("DB setup complete");
  try {
    const user = await userFactory();
    console.log("User created:", user.id);
    const challenge = await challengeFactory(user.id);
    console.log("Challenge created:", challenge.id);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
