/**
 * lib/auth/guards.ts
 *
 * Server-side authorization guards. Import these at the top of any Server
 * Component, Server Action, or Route Handler that requires authentication or
 * specific role privileges.
 *
 * Usage:
 *   const user = await requireAuth();          // throws / redirects if not logged in
 *   await requireRole(Role.ADMIN);             // throws ForbiddenError if role too low
 *   await requireOwnership(resource.userId);  // throws ForbiddenError if not owner/admin
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role, ROLE_POWER } from "./roles";

// ---------------------------------------------------------------------------
// Typed error classes
// ---------------------------------------------------------------------------

/** Thrown when no valid session exists. */
export class UnauthorizedError extends Error {
  readonly statusCode = 401;
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Thrown when a session exists but lacks the required permission. */
export class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(message = "You do not have permission to access this resource.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// ---------------------------------------------------------------------------
// Authenticated user shape returned by guards
// ---------------------------------------------------------------------------

export interface AuthenticatedUser {
  id: string;
  handle: string;
  email: string;
  role: Role;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

/**
 * Server-side guard that ensures a valid session exists.
 *
 * - In a Server Component context it calls `redirect()` to /auth/login so
 *   the browser is sent to the login page seamlessly.
 * - In a Route Handler or Server Action context it throws `UnauthorizedError`
 *   which the caller can catch and return a proper HTTP 401 response.
 *
 * @param options.redirectOnFailure  Set to `false` in Route Handlers /
 *        Server Actions where a redirect is inappropriate (defaults to true).
 */
export async function requireAuth(
  options: { redirectOnFailure?: boolean } = {},
): Promise<AuthenticatedUser> {
  const { redirectOnFailure = true } = options;
  const session = await auth();

  if (!session?.user?.id || !session?.user?.handle) {
    if (redirectOnFailure) {
      redirect("/auth/login");
    }
    throw new UnauthorizedError();
  }

  // isActive is stored in the JWT and surfaced via session augmentation.
  // A blocked account must not be able to use existing sessions.
  if (session.user.isActive === false) {
    if (redirectOnFailure) {
      redirect("/auth/login?error=AccountDisabled");
    }
    throw new UnauthorizedError("Your account has been disabled.");
  }

  return {
    id: session.user.id,
    handle: session.user.handle,
    email: session.user.email ?? "",
    role: (session.user.role as Role) ?? Role.USER,
    isActive: session.user.isActive ?? true,
  };
}

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------

/**
 * Verifies the currently logged-in user meets the minimum role power level.
 * Must be called after (or instead of) `requireAuth()`.
 *
 * @param allowedRole  Minimum role required (e.g. `Role.ADMIN`).
 * @throws UnauthorizedError if no session.
 * @throws ForbiddenError    if user's power is below the required level.
 */
export async function requireRole(allowedRole: Role): Promise<AuthenticatedUser> {
  const user = await requireAuth({ redirectOnFailure: false });

  const userPower = ROLE_POWER[user.role] ?? ROLE_POWER[Role.USER];
  const requiredPower = ROLE_POWER[allowedRole];

  if (userPower < requiredPower) {
    throw new ForbiddenError(
      `This action requires the '${allowedRole}' role or higher.`,
    );
  }

  return user;
}

// ---------------------------------------------------------------------------
// requireOwnership
// ---------------------------------------------------------------------------

/**
 * Ensures the logged-in user either owns the given resource or is an ADMIN.
 *
 * @param resourceUserId  The `user_id` stored on the resource being accessed.
 * @throws UnauthorizedError if no session.
 * @throws ForbiddenError    if user is not the owner and not an ADMIN.
 */
export async function requireOwnership(
  resourceUserId: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuth({ redirectOnFailure: false });

  const isOwner = user.id === resourceUserId;
  const isAdmin = ROLE_POWER[user.role] >= ROLE_POWER[Role.ADMIN];

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError(
      "You do not have permission to access this resource.",
    );
  }

  return user;
}
