import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { Signer } from "@aws-sdk/rds-signer";
import * as schema from "./schema";

const signer = new Signer({
  hostname: process.env.PGHOST || "",
  port: parseInt(process.env.PGPORT || "5432"),
  username: process.env.PGUSER || "",
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// КРИТИЧНО: Використовуємо строковий пароль для уникнення PAM помилок
const password = process.env.PGPASSWORD || "";

export const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on("connect", (client) => {
  if (process.env.NODE_ENV === "test") {
    client.query("SET search_path TO proofloom_test").catch((err) => {
      console.error("Failed to set search_path for test client:", err);
    });
  }
});

export const db = drizzle(pool, { schema });
export default pool;
