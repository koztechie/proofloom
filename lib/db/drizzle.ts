/**
 * lib/db/drizzle.ts — Drizzle ORM singleton, intentionally separate from
 * lib/db/client.ts.
 *
 * This file is the ONLY place that imports drizzle-orm/node-postgres.
 * Repositories load it via dynamic import() inside each async function so
 * that drizzle-orm/node-postgres (which does `import pg from "pg"` — a CJS
 * default import in ESM that Turbopack mis-handles) is NEVER evaluated at
 * module-init time and cannot cascade up to lib/auth.ts.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { pool } from "./client";
import * as schema from "./schema";

type DbSchema = typeof schema;

// Lazy singleton — only constructed on first repository call
let _db: NodePgDatabase<DbSchema> | undefined;

function initDb(): NodePgDatabase<DbSchema> {
  if (!_db) {
    _db = drizzle(pool, { schema });
  }
  return _db;
}

// Export a Proxy so the object reference is stable (importers can destructure
// or hold on to `db`) while still deferring drizzle() construction.
export const db: NodePgDatabase<DbSchema> = new Proxy(
  {} as NodePgDatabase<DbSchema>,
  {
    get(_target, prop, receiver) {
      return Reflect.get(initDb(), prop, receiver);
    },
  },
);
