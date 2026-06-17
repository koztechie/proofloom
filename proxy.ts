/**
 * Next.js proxy (route protection middleware).
 *
 * This project uses the "proxy" convention (Next.js ≥ 16).
 * Route protection is implemented with next-auth v4's getToken()
 * so unauthenticated requests to private routes are redirected to /auth/login.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/challenge",
  "/settings",
  "/api/challenges",
  "/api/proofs",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
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
  ],
};
