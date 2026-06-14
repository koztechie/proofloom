import Link from "next/link";
import { getLeaderboard } from "@/lib/dynamo/leaderboard";
import { getCurrentStreak } from "@/lib/dynamo/streaks";
import Header from "@/components/Header";

// КРИТИЧНО ДЛЯ ХАКАТОНУ: Incremental Static Regeneration (ISR).
// Сторінка кешується на серверах Vercel і оновлюється на фоні раз на 60 секунд.
// Це гарантує миттєве завантаження для тисяч суддів без перевантаження бази DynamoDB.
export const revalidate = 60;

const CATEGORIES = [
  "All",
  "Engineering",
  "SQL",
  "Python",
  "JavaScript",
  "Web Dev",
  "Design",
  "Writing",
  "Fitness",
  "Other",
];

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  // NEXT.JS 16: searchParams — це Promise
  const resolvedParams = await searchParams;
  const currentCategory =
    resolvedParams.category && CATEGORIES.includes(resolvedParams.category)
      ? resolvedParams.category
      : "All";

  // 1. Завантажуємо попередньо агреговані дані з партиції LEADERBOARD
  const rawEntries = await getLeaderboard(currentCategory, 20);

  // 2. Збагачуємо дані актуальними стріками паралельно (щоб уникнути N+1 проблеми)
  const entries = await Promise.all(
    rawEntries.map(async (entry) => {
      const streak = await getCurrentStreak(entry.handle);
      return { ...entry, streak };
    }),
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      {/* Навігація */}
      <Header />

      <main className="max-w-4xl mx-auto px-6 mt-12 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Leaderboard
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            The most consistent builders, ranked by verified proof. Filter by
            category to find your competition.
          </p>
        </div>

        {/* Навігація по категоріям (SSR-сумісна) */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat;
            const href =
              cat === "All"
                ? "/leaderboard"
                : `/leaderboard?category=${encodeURIComponent(cat)}`;
            return (
              <Link key={cat} href={href}>
                <div
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
                  }`}
                >
                  {cat}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Таблиця Лідерборду */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Заголовки колонок */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-2 md:col-span-1 text-center">Rank</div>
            <div className="col-span-6 md:col-span-5">Builder</div>
            <div className="col-span-4 md:col-span-3 hidden md:block">
              Category
            </div>
            <div className="col-span-4 md:col-span-3 text-right">
              Total Score
            </div>
          </div>

          {/* Дані */}
          <div className="divide-y divide-zinc-800/50">
            {entries.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 italic">
                No proofs submitted in this category yet. Be the first!
              </div>
            ) : (
              entries.map((entry, index) => {
                const rank = index + 1;
                let rankDisplay = (
                  <span className="text-zinc-400 font-medium">{rank}</span>
                );

                if (rank === 1)
                  rankDisplay = (
                    <span className="text-xl" title="1st Place">
                      🥇
                    </span>
                  );
                else if (rank === 2)
                  rankDisplay = (
                    <span className="text-xl" title="2nd Place">
                      🥈
                    </span>
                  );
                else if (rank === 3)
                  rankDisplay = (
                    <span className="text-xl" title="3rd Place">
                      🥉
                    </span>
                  );

                return (
                  <div
                    key={`${entry.handle}-${entry.category}`}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="col-span-2 md:col-span-1 text-center flex justify-center">
                      {rankDisplay}
                    </div>

                    <div className="col-span-6 md:col-span-5 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white uppercase select-none">
                        {entry.handle.substring(0, 2)}
                      </div>
                      <Link
                        href={`/u/${entry.handle}`}
                        className="font-bold text-zinc-200 hover:text-emerald-400 transition-colors truncate"
                      >
                        @{entry.handle}
                        {entry.streak > 0 && (
                          <span className="ml-2 inline-flex items-center text-xs font-semibold text-emerald-500">
                            🔥 {entry.streak}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="col-span-4 md:col-span-3 hidden md:block">
                      <span className="text-xs bg-zinc-950 border border-zinc-700 px-2.5 py-1 rounded-full text-zinc-300 font-semibold">
                        {entry.category}
                      </span>
                    </div>

                    <div className="col-span-4 md:col-span-3 text-right">
                      <span className="font-black text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-md">
                        {entry.total_score}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
