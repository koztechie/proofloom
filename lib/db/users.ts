/**
 * lib/db/users.ts
 *
 * @deprecated These are thin compatibility wrappers around the new
 * `lib/db/repositories/user.repository.ts`. Existing call sites continue to
 * work without modification. Migrate new code to import directly from the
 * repository module.
 */

import bcrypt from "bcryptjs";
import * as userRepo from "./repositories/user.repository";
import { User } from "@/types";

/** Maps a Drizzle camelCase row to the snake_case legacy shape. */
function toUser(row: userRepo.UserRow): User {
  return {
    id: row.id,
    handle: row.handle,
    email: row.email,
    password_hash: row.passwordHash,
    display_name: row.displayName ?? null,
    bio: row.bio ?? null,
    avatar_url: row.avatarUrl ?? null,
    location: row.location ?? null,
    website_url: row.websiteUrl ?? null,
    twitter_url: row.twitterUrl ?? null,
    github_url: row.githubUrl ?? null,
    linkedin_url: row.linkedinUrl ?? null,
    avatar_type: row.avatarType,
    role: row.role,
    is_active: row.isActive,
    created_at: row.createdAt ?? new Date(0),
  };
}

/** @deprecated Use userRepo.create() directly. */
export async function createUser(
  handle: string,
  email: string,
  passwordPlain: string,
  displayName?: string,
): Promise<User> {
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  const row = await userRepo.create({
    handle,
    email,
    passwordHash,
    displayName: displayName ?? null,
  });
  return toUser(row);
}

/** @deprecated Use userRepo.updateProfile() directly. */
export async function updateUserProfile(
  id: string,
  params: {
    displayName?: string | null;
    bio?: string | null;
    location?: string | null;
    websiteUrl?: string | null;
    twitterUrl?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    avatarType?: string;
  },
): Promise<User> {
  const row = await userRepo.updateProfile(id, params);
  return toUser(row);
}

/** @deprecated Use userRepo.getByHandle() directly. */
export async function getUserByHandle(handle: string): Promise<User | null> {
  const row = await userRepo.getByHandle(handle);
  return row ? toUser(row) : null;
}

/** @deprecated Use userRepo.getByEmail() directly. */
export async function getUserByEmail(email: string): Promise<User | null> {
  const row = await userRepo.getByEmail(email);
  return row ? toUser(row) : null;
}

/** @deprecated Use userRepo.getById() directly. */
export async function getUserById(id: string): Promise<User | null> {
  const row = await userRepo.getById(id);
  return row ? toUser(row) : null;
}
