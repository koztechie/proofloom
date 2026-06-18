/**
 * proxy.ts — Next.js 16 root proxy (route protection middleware).
 *
 * Protects all private routes by verifying the presence of a JWT token.
 * Unauthenticated requests are redirected to /auth/login with a `callbackUrl`
 * parameter so users can be sent back after a successful login.
 *
 * Public routes (/auth/*, /, /leaderboard, /pricing, /u/*) are completely
 * unaffected — the matcher only runs on the paths listed in `config.matcher`.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** All route prefixes that require a valid session. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/challenge",
  "/settings",
  "/api/challenges",
  "/api/proofs",
  "/api/reports",
  "/api/admin",
] as const;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Fast path: public route — skip token verification entirely.
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || "",
  });

  if (!token) {
    // Encode the full original URL so the login page can redirect back.
    const callbackUrl = encodeURIComponent(pathname + search);
    const loginUrl = new URL(
      `/auth/login?callbackUrl=${callbackUrl}`,
      request.url,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/challenge/:path*",
    "/settings/:path*",
    "/api/challenges/:path*",
    "/api/proofs/:path*",
    "/api/reports/:path*",
    "/api/admin/:path*",
  ],
};
