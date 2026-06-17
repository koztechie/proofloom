/**
 * lib/db/client.ts — pool only, no Drizzle imports.
 *
 * Keeping this file free of drizzle-orm/node-postgres is critical: this
 * module is transitively imported by lib/auth.ts at module-init time.
 * Any top-level import that reaches drizzle-orm/node-postgres (which does
 * `import pg from "pg"` — a CJS default-import in ESM) crashes Turbopack
 * before NextAuth() is evaluated, making `auth` appear as undefined.
 *
 * The Drizzle instance lives in lib/db/drizzle.ts and is loaded lazily
 * via dynamic import() inside each repository function.
 */

import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";

// Auto-refresh IAM auth token (token lifetime is 15 minutes)
const signer = new Signer({
  hostname: process.env.PGHOST ?? "",
  port: parseInt(process.env.PGPORT ?? "5432"),
  username: process.env.PGUSER ?? "postgres",
  region: process.env.AWS_REGION ?? "us-east-1",
});

// Singleton pool — reused across hot-reloads and serverless invocations
export const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT ?? "5432"),
  database: process.env.PGDATABASE ?? "postgres",
  user: process.env.PGUSER ?? "postgres",
  password: async () => await signer.getAuthToken(),
  ssl: { rejectUnauthorized: false }, // Required for AWS Aurora
  max: 10,
  idleTimeoutMillis: 30_000,
});

export default pool;
