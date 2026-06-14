import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChallengesByUserId } from "@/lib/db/challenges";
import { getCurrentStreak, getTotalProofScore } from "@/lib/dynamo/streaks";
import { getProofsByHandle } from "@/lib/dynamo/proofs";
import Link from "next/link";
import GenerateReportButton from "@/components/GenerateReportButton";
import Logo from "@/components/logo";

export default async function DashboardPage() {
  const session = await auth();

  // Додатковий захист: якщо сесії немає — редірект на логін
  if (!session?.user?.id || !session?.user?.handle) {
    redirect("/auth/login");
  }

  const handle = session.user.handle;
  const userId = session.user.id;

  // ОПТИМІЗАЦІЯ: завантажуємо дані з Aurora PG та DynamoDB ПАРАЛЕЛЬНО
  const [challenges, currentStreak, totalScore, proofs] = await Promise.all([
    getChallengesByUserId(userId),
    getCurrentStreak(handle),
    getTotalProofScore(handle),
    getProofsByHandle(handle),
  ]);

  const activeChallengesCount = challenges.length;

  // Розрахунок середнього балу по всіх звітах користувача
  const avgScore =
    proofs.length > 0
      ? Math.round(
          proofs.reduce((sum, p) => sum + p.ai_score, 0) / proofs.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      {/* Шапка / Навігація */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Logo />
          <nav className="hidden md:flex space-x-4 text-sm font-medium text-zinc-400">
            <Link href="/dashboard" className="text-zinc-100">
              Dashboard
            </Link>
            <Link href="/leaderboard" className="hover:text-zinc-200">
              Leaderboard
            </Link>
            <Link href={`/u/${handle}`} className="hover:text-zinc-200">
              Profile
            </Link>
            <Link href="/pricing" className="hover:text-zinc-200">
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-zinc-400">@{handle}</span>
          <Link
            href={`/u/${handle}`}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Your challenges
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Welcome back. Keep your streaks alive and your proof flowing.
            </p>
          </div>
          {/* Кнопка створення веде на сторінку форми, яку ми створимо на Кроці 31 */}
          <div className="flex items-center space-x-4">
            <GenerateReportButton />
            <Link
              href="/dashboard/new"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>+ New challenge</span>
            </Link>
          </div>
        </div>

        {/* Метрики (Stats Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Active challenges
            </p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">
              {activeChallengesCount}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Current streak
            </p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">
              {currentStreak} days
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Average score
            </p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">
              {avgScore}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Total Score
            </p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">
              {totalScore}
            </p>
          </div>
        </div>

        {/* Список челенджів */}
        <div className="grid md:grid-cols-2 gap-6">
          {challenges.length === 0 ? (
            <div className="col-span-2 text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
              <p className="text-zinc-400 text-lg">
                No active challenges found.
              </p>
              <Link
                href="/dashboard/new"
                className="mt-4 inline-block text-sm text-emerald-500 hover:underline"
              >
                Create your first challenge now
              </Link>
            </div>
          ) : (
            challenges.map((challenge) => {
              // Рахуємо кількість успішних звітів саме для цього челенджу
              const challengeProofs = proofs.filter(
                (p) => p.challenge_id === challenge.id,
              );
              const proofsCount = challengeProofs.length;

              // Рахуємо відсоток прогресу до цілі
              const progressPercentage = Math.min(
                100,
                Math.round((proofsCount / challenge.target_days) * 100),
              );

              return (
                <div
                  key={challenge.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full text-zinc-300 font-semibold">
                        {challenge.skill_category}
                      </span>
                      <span className="text-xs text-zinc-500">
                        Target: {challenge.target_days} days
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mt-4">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Submitted proofs: {proofsCount} days
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-zinc-400 mb-1">
                        <span>Progress</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-zinc-500">
                        Created:{" "}
                        {new Date(challenge.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/challenge/${challenge.id}`}
                        className="text-sm font-semibold text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
                      >
                        <span>Open</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
