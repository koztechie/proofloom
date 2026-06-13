import { notFound } from "next/navigation";
import { getUserByHandle } from "@/lib/db/users";
import { getChallengesByUserId } from "@/lib/db/challenges";
import { getProofsByHandle } from "@/lib/dynamo/proofs";
import { getCurrentStreak, getTotalProofScore } from "@/lib/dynamo/streaks";
import Link from "next/link";
import HeatmapCalendar from "@/components/HeatmapCalendar";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  // КРИТИЧНО ДЛЯ NEXT.JS 16: асинхронно отримуємо параметри динамічного роуту
  const { handle } = await params;

  // 1. Шукаємо користувача в Aurora PostgreSQL за його унікальним handle
  const user = await getUserByHandle(handle);
  if (!user) {
    notFound(); // Якщо користувача немає в базі — віддаємо 404 сторінку
  }

  // 2. ОПТИМІЗАЦІЯ: завантажуємо дані з Aurora PG та DynamoDB паралельно
  const [challenges, proofs, currentStreak, totalScore] = await Promise.all([
    getChallengesByUserId(user.id, { publicOnly: true }), // Тільки публічні челенджі
    getProofsByHandle(handle),
    getCurrentStreak(handle),
    getTotalProofScore(handle),
  ]);

  const heatmapData = proofs.map((p) => ({
    date: p.sk.split("#")[1],
    score: p.ai_score,
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      {/* Навігація */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-emerald-500"
          >
            ProofLoom
          </Link>
          <nav className="flex space-x-4 text-sm font-medium text-zinc-400">
            <Link href="/dashboard" className="hover:text-zinc-200">
              Dashboard
            </Link>
            <Link href="/leaderboard" className="hover:text-zinc-200">
              Leaderboard
            </Link>
            <Link href="/pricing" className="hover:text-zinc-200">
              Pricing
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-12 space-y-8">
        {/* Блок профілю користувача */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-3xl font-black text-white uppercase select-none">
              {handle.substring(0, 2)}
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight">
                {user.display_name || handle}
              </h1>
              <p className="text-sm text-zinc-400">@{handle}</p>
              {user.bio && (
                <p className="text-sm text-zinc-300 max-w-lg">{user.bio}</p>
              )}
              <p className="text-xs text-zinc-500">
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Швидкі метрики */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-lg text-center">
              <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">
                Streak
              </span>
              <span className="text-lg font-bold text-emerald-400">
                {currentStreak} days
              </span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-lg text-center">
              <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">
                Total Score
              </span>
              <span className="text-lg font-bold text-emerald-400">
                {totalScore}
              </span>
            </div>
          </div>
        </div>

        {/* Реальний інтерактивний календар Heatmap */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4">Activity Heatmap</h2>
          <HeatmapCalendar proofs={heatmapData} />
        </div>

        {/* Публічні челенджі профілю */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Active Challenges</h2>
          {challenges.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">
              No public challenges created yet.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {challenges.map((challenge) => {
                const challengeProofs = proofs.filter(
                  (p) => p.challenge_id === challenge.id,
                );
                const progressPercentage = Math.min(
                  100,
                  Math.round(
                    (challengeProofs.length / challenge.target_days) * 100,
                  ),
                );

                return (
                  <div
                    key={challenge.id}
                    className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full text-zinc-300 font-semibold">
                        {challenge.skill_category}
                      </span>
                      <h3 className="text-lg font-bold mt-3">
                        {challenge.title}
                      </h3>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Progress: {progressPercentage}%</span>
                        <span>Goal: {challenge.target_days} days</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
