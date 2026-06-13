import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";

// Автоматична генерація IAM-токену кожні 15 хвилин
const signer = new Signer({
  hostname: process.env.PGHOST || "",
  port: parseInt(process.env.PGPORT || "5432"),
  username: process.env.PGUSER || "postgres",
  region: process.env.AWS_REGION || "us-east-1",
});

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE || "postgres",
  user: process.env.PGUSER || "postgres",
  password: async () => await signer.getAuthToken(),
  ssl: { rejectUnauthorized: false }, // Обов'язково для AWS Aurora
  max: 10,
  idleTimeoutMillis: 30000,
});

export default pool;
