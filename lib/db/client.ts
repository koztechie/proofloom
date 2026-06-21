import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { Signer } from "@aws-sdk/rds-signer";
import * as schema from "./schema";

const clientConfig: any = {
  hostname: process.env.PGHOST || "",
  port: parseInt(process.env.PGPORT || "5432"),
  username: process.env.PGUSER || "",
  region: process.env.AWS_REGION || "us-east-1",
};

// Антикрихкість: якщо в .env.local ключі записані як пусті лапки "",
// ми ігноруємо їх, дозволяючи SDK безперешкодно зчитати твої системні ~/.aws/credentials!
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

// Робимо пул іменованим експортом [1.1.3]
export const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: async () => await signer.getAuthToken(),
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
