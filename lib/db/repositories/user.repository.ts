/**
 * User repository — typed CRUD operations over the `users` table.
 *
 * `db` is loaded via dynamic import() so drizzle-orm/node-postgres is never
 * evaluated at module-init time, keeping lib/auth.ts's import chain clean.
 */

import { eq } from "drizzle-orm";
import { users } from "../schema";

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UpdateProfileParams = {
  displayName?: string | null;
  bio?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  avatarType?: string;
};

/** Lazily loads the Drizzle instance — cached after first call by the module system. */
async function getDb() {
  const { db } = await import("../drizzle");
  return db;
}

// ---------------------------------------------------------------------------
// getByEmail
// ---------------------------------------------------------------------------
export async function getByEmail(email: string): Promise<UserRow | null> {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] ?? null;
}

// ---------------------------------------------------------------------------
// getByHandle
// ---------------------------------------------------------------------------
export async function getByHandle(handle: string): Promise<UserRow | null> {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);
  return result[0] ?? null;
}

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------
export async function getById(id: string): Promise<UserRow | null> {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------
export async function create(params: NewUser): Promise<UserRow> {
  const db = await getDb();
  const [row] = await db.insert(users).values(params).returning();
  if (!row) throw new Error("Failed to create user");
  return row;
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
export async function updateProfile(
  id: string,
  params: UpdateProfileParams,
): Promise<UserRow> {
  const db = await getDb();
  const [row] = await db
    .update(users)
    .set({
      displayName: params.displayName ?? null,
      bio: params.bio ?? null,
      location: params.location ?? null,
      websiteUrl: params.websiteUrl ?? null,
      twitterUrl: params.twitterUrl ?? null,
      githubUrl: params.githubUrl ?? null,
      linkedinUrl: params.linkedinUrl ?? null,
      avatarType: params.avatarType ?? "initials",
    })
    .where(eq(users.id, id))
    .returning();
  if (!row) throw new Error("Failed to update profile");
  return row;
}
