/**
 * lib/auth/roles.ts
 *
 * Defines the application's Role enum and a numeric power map used for
 * hierarchical role comparisons (higher number = more privilege).
 */

export enum Role {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

/** Maps each role to a numeric power level for ≥ comparisons. */
export const ROLE_POWER: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.MODERATOR]: 2,
  [Role.ADMIN]: 3,
} as const;
