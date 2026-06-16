import pool from "./client";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  handle: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  avatar_type: string;
  created_at: Date;
}

export async function createUser(
  handle: string,
  email: string,
  passwordPlain: string,
  displayName?: string,
): Promise<User> {
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  const query = `
    INSERT INTO users (handle, email, password_hash, display_name)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [handle, email, passwordHash, displayName || null];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

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
  const query = `
    UPDATE users
    SET 
      display_name = $2,
      bio = $3,
      location = $4,
      website_url = $5,
      twitter_url = $6,
      github_url = $7,
      linkedin_url = $8,
      avatar_type = $9
    WHERE id = $1
    RETURNING *;
  `;
  const values = [
    id,
    params.displayName || null,
    params.bio || null,
    params.location || null,
    params.websiteUrl || null,
    params.twitterUrl || null,
    params.githubUrl || null,
    params.linkedinUrl || null,
    params.avatarType || "initials",
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getUserByHandle(handle: string): Promise<User | null> {
  const query = "SELECT * FROM users WHERE handle = $1 LIMIT 1;";
  const { rows } = await pool.query(query, [handle]);
  return rows[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const query = "SELECT * FROM users WHERE email = $1 LIMIT 1;";
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const query = "SELECT * FROM users WHERE id = $1 LIMIT 1;";
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}
