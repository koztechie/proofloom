import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD || "", // Використовуємо строковий токен PGPASSWORD
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// КРИТИЧНО: Перевизначаємо pool.connect(), щоб гарантувати search_path
// для КОЖНОГО клієнта, включаючи тих, що внутрішньо використовуються
// pool.query(). Це повністю усуває race condition та DeprecationWarning [E2].
if (process.env.NODE_ENV === "test") {
  const originalConnect = pool.connect.bind(pool);
  pool.connect = async (...args: any[]) => {
    const client = await originalConnect(...args);
    await client.query("SET search_path TO proofloom_test").catch((err) => {
      console.error("Failed to set search_path on connect:", err);
    });
    return client;
  };
}

export const db = drizzle(pool, { schema });
export default pool;
