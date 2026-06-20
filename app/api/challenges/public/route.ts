import { NextRequest, NextResponse } from "next/server";
import { getPublicChallengesByCategory } from "@/lib/db/challenges";
import { memoryCache } from "@/lib/cache/memory-cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "All";
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const cacheKey = `public-challenges:${category}:${limit}`;

  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const challenges = await getPublicChallengesByCategory(category, limit);

  memoryCache.set(cacheKey, challenges, 60); // 60-second TTL
  return NextResponse.json(challenges);
}
