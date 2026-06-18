/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * NextAuth catch-all route handler.
 * Wraps the default handlers with IP-based rate limiting to protect against
 * credential-stuffing and brute-force attacks.
 */

import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import { isRateLimited, LIMITS } from "@/lib/security/rate-limit";

/** Extract the best available client IP from standard forwarding headers. */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>,
): Promise<Response> {
  const ip = getClientIp(req);
  const limited = await isRateLimited(
    ip,
    LIMITS.AUTH.limit,
    LIMITS.AUTH.intervalSeconds,
  );

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(LIMITS.AUTH.intervalSeconds),
        },
      },
    );
  }

  return handler(req);
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, (r) => handlers.GET(r));
}

export async function POST(req: NextRequest) {
  return withRateLimit(req, (r) => handlers.POST(r));
}
