import { notFound } from "next/navigation";
import { getUserByHandle } from "@/lib/db/users";
import { getChallengesByUserId } from "@/lib/db/challenges";
import { getProofsByHandle } from "@/lib/dynamo/proofs";
import { getCurrentStreak, getTotalProofScore } from "@/lib/dynamo/streaks";
import db from "@/lib/db/client"; // Наш синглтон Pool клієнта pg
import Link from "next/link";

// Нові імпорти згідно з Feature-Based архітектурою
import ContributionHeatmap from "@/components/features/profile/ContributionHeatmap";
import WeeklyCoachReport from "@/components/features/report/WeeklyCoachReport";
import ProofList from "@/components/features/proof/ProofList";
import Header from "@/components/Header";

// Суворі типи з нашого Type-Hardening шару
import { User, Challenge, Proof } from "@/types";
import crypto from "crypto";

interface PageProps {
  params: Promise<{ handle: string }>;
}

interface EnrichedProof extends Proof {
  skill_category: string;
}

export default async function PublicProfilePage({ params }: PageProps) {
  // NEXT.JS 16: авейтимо параметри роуту
  const { handle } = await params;

  // 1. Шукаємо користувача в Aurora PostgreSQL
  const user: User | null = await getUserByHandle(handle);
  if (!user) {
    notFound();
  }

  // 2. Паралельно завантажуємо дані з Postgres та DynamoDB (паралельна оптимізація)
  const [challenges, proofs, currentStreak, totalScore, weeklyReportResult] =
    await Promise.all([
      getChallengesByUserId(user.id, { publicOnly: true }) as Promise<
        Challenge[]
      >,
      getProofsByHandle(handle) as Promise<Proof[]>,
      getCurrentStreak(handle),
      getTotalProofScore(handle),
      // Виконуємо сирий SQL-запит на пулі з'єднань
      db.query(
        `
        SELECT * FROM weekly_reports
        WHERE user_id = $1
        ORDER BY week_start DESC
        LIMIT 1
      `,
        [user.id],
      ),
    ]);

  const weeklyReportRows = weeklyReportResult.rows;

  // 3. Генерація Gravatar
  const emailHash = crypto
    .createHash("md5")
    .update(user.email.toLowerCase().trim())
    .digest("hex");
  const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=150`;
  const useGravatar = user.avatar_type === "gravatar";

  // 4. Суворе збагачення типів (In-Memory Join) з реляційними категоріями
  const enrichedProofs: EnrichedProof[] = proofs.map((p: Proof) => {
    const ch = challenges.find((c: Challenge) => c.id === p.challenge_id);
    return {
      ...p,
      skill_category: ch ? ch.skill_category : "Other",
    };
  });

  // Створюємо чисті дані для календаря Heatmap з примусовою типізацією p
  const heatmapData = (enrichedProofs as EnrichedProof[]).map(
    (p: EnrichedProof) => ({
      date: p.sk.split("#")[1] || "",
      score: p.ai_score,
    }),
  );

  const recentProofs = enrichedProofs.slice(0, 10);

  // 5. Дефенсивний мапінг сирих SQL-колонок snake_case у формат пропсів UI-компонента
  const weeklyReport = weeklyReportRows[0]
    ? {
        week_start: weeklyReportRows[0].week_start,
        week_end: weeklyReportRows[0].week_end,
        ai_summary: weeklyReportRows[0].ai_summary,
        ai_strengths: weeklyReportRows[0].ai_strengths,
        ai_gaps: weeklyReportRows[0].ai_gaps,
        ai_recommendation: weeklyReportRows[0].ai_recommendation,
      }
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      <Header />

      <main className="max-w-4xl mx-auto px-6 mt-12 space-y-8">
        {/* Блок профілю користувача */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {useGravatar ? (
              <img
                src={gravatarUrl}
                alt={user.display_name || handle}
                className="w-20 h-20 rounded-full border-2 border-emerald-500 shadow-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-3xl font-black text-white uppercase select-none">
                {handle.substring(0, 2)}
              </div>
            )}

            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
                {user.display_name || handle}
              </h1>
              <p className="text-sm text-zinc-400">@{handle}</p>

              {user.bio && (
                <p className="text-sm text-zinc-300 max-w-lg italic">
                  "{user.bio}"
                </p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-zinc-500 pt-1">
                {user.location && (
                  <span className="flex items-center gap-1">
                    📍 {user.location}
                  </span>
                )}
                {user.website_url && (
                  <a
                    href={user.website_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow noindex"
                    className="text-emerald-500 hover:underline flex items-center gap-1"
                  >
                    🔗 Website
                  </a>
                )}
                <span>
                  📅 Joined: {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Соціалки */}
              <div className="flex justify-center md:justify-start gap-3 pt-2">
                {user.github_url && (
                  <a
                    href={user.github_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow noindex"
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    GitHub
                  </a>
                )}
                {user.twitter_url && (
                  <a
                    href={user.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow noindex"
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Twitter
                  </a>
                )}
                {user.linkedin_url && (
                  <a
                    href={user.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow noindex"
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
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

        {/* Календар Heatmap */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4">Activity Heatmap</h2>
          <ContributionHeatmap proofs={heatmapData} />
        </div>

        {/* Блок тижневої аналітики */}
        <WeeklyCoachReport report={weeklyReport} />

        {/* Публічні челенджі */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Active Challenges</h2>
          {challenges.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">
              No public challenges created yet.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {challenges.map((challenge: Challenge) => {
                const challengeProofs = proofs.filter(
                  (p: Proof) => p.challenge_id === challenge.id,
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

        {/* Стрічка останніх звітів користувача */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Proofs</h2>
          <ProofList proofs={recentProofs} />
        </div>
      </main>
    </div>
  );
}
