import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const poolConfig: ConstructorParameters<typeof Pool>[0] = {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD || "",
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 1000,
  allowExitOnIdle: true,
};

// КРИТИЧНО: Встановлюємо search_path на рівні PostgreSQL backend при кожному новому з'єднанні.
// Це НАДІЙНІШЕ за pool.on("connect") чи pool.connect override, бо виконується до того,
// як pg-pool отримає контроль над клієнтом. Усуває race condition та DeprecationWarning.
if (process.env.NODE_ENV === "test") {
  poolConfig.options = "-c search_path=proofloom_test";
}

export const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
export default pool;
