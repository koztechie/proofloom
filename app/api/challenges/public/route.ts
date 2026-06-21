import { NextRequest, NextResponse } from "next/server";
import { getPublicChallengesByCategory } from "@/lib/db/challenges";
import { memoryCache } from "@/lib/cache/memory-cache";
import { isRateLimited, LIMITS } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "All";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
  const limited = await isRateLimited(ip, LIMITS.PUBLIC_LISTING.limit, LIMITS.PUBLIC_LISTING.intervalSeconds);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cacheKey = `public-challenges:${category}:${limit}`;

  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const challenges = await getPublicChallengesByCategory(category, limit);

  memoryCache.set(cacheKey, challenges, 60); // 60-second TTL
  return NextResponse.json(challenges);
}
