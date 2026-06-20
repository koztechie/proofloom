import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/dynamo/leaderboard";
import { getCurrentStreak } from "@/lib/dynamo/streaks";
import { memoryCache } from "@/lib/cache/memory-cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "All";
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const cacheKey = `leaderboard:${category}:${limit}`;

  const cached = memoryCache.get(cacheKey);
  if (cached) {
    // Return stale from cache immediately
    // Wait, the cache already handles TTL expiration, so this is valid
    return NextResponse.json(cached);
  }

  const rawEntries = await getLeaderboard(category, limit);
  const entries = await Promise.all(
    rawEntries.map(async (entry) => {
      const streak = await getCurrentStreak(entry.handle);
      return { ...entry, streak };
    }),
  );

  memoryCache.set(cacheKey, entries, 300); // 300-second TTL
  return NextResponse.json(entries);
}
