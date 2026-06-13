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
  created_at: Date;
}

export async function createUser(
  handle: string,
  email: string,
  passwordPlain: string,
  displayName?: string,
): Promise<User> {
  // Хешування паролю з 10 salt rounds (оптимально для балансу безпеки/швидкості)
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
