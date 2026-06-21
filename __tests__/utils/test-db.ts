import pool from "@/lib/db/client";

export async function setupTestDb() {
  console.log("=== [TEST DB SETUP DIAGNOSTICS] ===");
  console.log("PGHOST:", process.env.PGHOST);
  console.log("PGUSER:", process.env.PGUSER);
  console.log(
    "AWS_ACCESS_KEY_ID:",
    process.env.AWS_ACCESS_KEY_ID
      ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...`
      : "undefined",
  );
  console.log(
    "AWS_SECRET_ACCESS_KEY exists:",
    !!process.env.AWS_SECRET_ACCESS_KEY,
  );
  console.log("===================================");

  // Створюємо схему, якщо її немає [E2]
  await pool.query("CREATE SCHEMA IF NOT EXISTS proofloom_test;");

  // Явно встановлюємо search_path для поточного з'єднання мігратора [E2]
  await pool.query("SET search_path TO proofloom_test;");
}

export async function truncateTestDb() {
  const tables = [
    "notifications",
    "weekly_reports",
    "proofs",
    "challenges",
    "users",
  ];
  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE proofloom_test.${table} CASCADE;`);
  }
}

export async function teardownTestDb() {
  await pool.end(); // Закриваємо з'єднання пулу
}
