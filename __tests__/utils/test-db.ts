import { pool } from "../../lib/db/client";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";

// Attach an event listener to ensure all new connections default to our test schema
pool.on("connect", (client) => {
  client.query("SET search_path TO proofloom_test, public;").catch(console.error);
});

export const testDb = drizzle(pool);

export async function setupTestDb() {
  // Create schema explicitly
  await pool.query("CREATE SCHEMA IF NOT EXISTS proofloom_test;");
  
  // Need to set for current connected client as well if any commands run right here
  await pool.query("SET search_path TO proofloom_test, public;");
  
  // Apply migrations
  await migrate(testDb, { migrationsFolder: path.resolve(process.cwd(), "lib/db/migrations") });
}

export async function truncateTestDb() {
  const res = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'proofloom_test' 
      AND tablename != 'drizzle__migrations'
      AND tablename != '__drizzle_migrations';
  `);
  
  const tables = res.rows.map(r => `"proofloom_test"."${r.tablename}"`).join(", ");
  
  if (tables) {
    await pool.query(`TRUNCATE ${tables} CASCADE;`);
  }
}

export async function teardownTestDb() {
  // Cleanly close the pool if needed
  await pool.end();
}
