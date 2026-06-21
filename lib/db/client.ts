import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { Signer } from "@aws-sdk/rds-signer";
import * as schema from "./schema";

const clientConfig: any = {
  hostname: process.env.PGHOST || "",
  port: parseInt(process.env.PGPORT || "5432"),
  username: process.env.PGUSER || "",
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

if (
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_ACCESS_KEY_ID.trim() !== "" &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_SECRET_ACCESS_KEY.trim() !== ""
) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const signer = new Signer(clientConfig);

export const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD || "", // Використовуємо строковий токен PGPASSWORD
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// Безпечно встановлюємо search_path для КОЖНОГО нового з'єднання пулу під час тестів [E2]
if (process.env.NODE_ENV === "test") {
  pool.on("connect", async (client) => {
    await client.query("SET search_path TO proofloom_test").catch((err) => {
      console.error("Failed to set search_path on connect:", err);
    });
  });
}

export const db = drizzle(pool, { schema });
export default pool;
