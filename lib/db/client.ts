import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { Signer } from "@aws-sdk/rds-signer";
import * as schema from "./schema";

const signer = new Signer({
  hostname: process.env.PGHOST || "",
  port: parseInt(process.env.PGPORT || "5432"),
  username: process.env.PGUSER || "",
  region: process.env.AWS_REGION || "us-east-1",
});

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: async () => await signer.getAuthToken(),
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// АНТИКРИХКІСТЬ: перехоплюємо момент створення кожного нового клієнта в пулі.
// Виконуємо запит перемикання схеми після успішного входу [E2]
pool.on("connect", (client) => {
  if (process.env.NODE_ENV === "test") {
    client.query("SET search_path TO proofloom_test").catch((err) => {
      console.error("Failed to set search_path for test client:", err);
    });
  }
});

// Експортуємо db як названий експорт для Drizzle [E1, E5]
export const db = drizzle(pool, { schema });

// Експортуємо pool як дефолтний експорт для pg клієнта
export default pool;
