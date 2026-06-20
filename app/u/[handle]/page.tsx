import crypto from "crypto";
import { notFound } from "next/navigation";
import { getUserByHandle } from "@/lib/db/users";
import { getChallengesByUserId } from "@/lib/db/challenges";
import { getProofsByHandle } from "@/lib/dynamo/proofs";
import { getCurrentStreak, getTotalProofScore } from "@/lib/dynamo/streaks";
import ContributionHeatmap from "@/components/features/profile/ContributionHeatmap";
import ProofList from "@/components/features/proof/ProofList";
import Link from "next/link";
import { Metadata } from "next";
import pool from "@/lib/db/client";
import WeeklyCoachReport from "@/components/features/report/WeeklyCoachReport";
import Header from "@/components/Header";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // КРИТИЧНО ДЛЯ NEXT.JS 16: асинхронно отримуємо параметри
  const { handle } = await params;

  const user = await getUserByHandle(handle);

  if (!user) {
    return {
      title: "User Not Found | ProofLoom",
      description: "The requested profile does not exist.",
    };
  }

  const streak = await getCurrentStreak(handle);
  const displayName = user.display_name || handle;
  const title = `${displayName} (@${handle}) | ProofLoom`;
  const description = `${streak}-day skill building streak. AI-verified daily progress.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://proofloom.vercel.app/u/${handle}`,
      siteName: "ProofLoom",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  // КРИТИЧНО ДЛЯ NEXT.JS 16: асинхронно отримуємо параметри динамічного роуту
  const { handle } = await params;

  // 1. Шукаємо користувача в Aurora PostgreSQL за його унікальним handle
  const user = await getUserByHandle(handle);
  if (!user) {
    notFound(); // Якщо користувача немає в базі — 404
  }

  // 2. ОПТИМІЗАЦІЯ: завантажуємо дані з Aurora PG та DynamoDB паралельно
  const [challenges, proofs, currentStreak, totalScore] = await Promise.all([
    getChallengesByUserId(user.id, { publicOnly: true }),
    getProofsByHandle(handle),
    getCurrentStreak(handle),
    getTotalProofScore(handle),
  ]);

  // Генеруємо хеш пошти для завантаження Gravatar аватара
  const emailHash = crypto
    .createHash("md5")
    .update(user.email.toLowerCase().trim())
    .digest("hex");
  const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=150`;
  const useGravatar = user.avatar_type === "gravatar";

  // 3. Зчитуємо останній тижневий звіт користувача з Aurora PostgreSQL [E6]
  const { rows: reportRows } = await pool.query(
    `
    SELECT * FROM weekly_reports
    WHERE user_id = $1
    ORDER BY week_start DESC
    LIMIT 1
  `,
    [user.id],
  );
  const weeklyReport = reportRows[0] || null;

  // 3. Збагачуємо NoSQL-звіти реляційними категоріями з Postgres
  const enrichedProofs = proofs.map((p) => {
    const ch = challenges.find((c) => c.id === p.challenge_id);
    return {
      ...p,
      skill_category: ch ? ch.skill_category : "Other",
    };
  });

  // 4. Створюємо чисті дані для календаря Heatmap
  const heatmapData = enrichedProofs.map((p) => ({
    date: p.sk.split("#")[1] || "",
    score: p.ai_score,
  }));

  // 5. Обрізаємо до 10 останніх звітів для виведення в стрічку
  const recentProofs = enrichedProofs.slice(0, 10);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            dateCreated: user.created_at,
            mainEntity: {
              "@type": "Person",
              name: user.display_name || handle,
              alternateName: handle,
              description: user.bio || undefined,
              image: useGravatar ? gravatarUrl : undefined,
              sameAs: [
                user.website_url,
                user.github_url,
                user.twitter_url,
                user.linkedin_url
              ].filter(Boolean)
            }
          })
        }}
      />
      {/* Шапка */}
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

              {/* Соціалки з SEO-захистом від спаму */}
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

        {/* Реальний інтерактивний календар Heatmap */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4">Activity Heatmap</h2>
          <ContributionHeatmap proofs={heatmapData} />
        </div>

        {/* Реальний інтерактивний календар Heatmap */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4">Activity Heatmap</h2>
          <ContributionHeatmap proofs={heatmapData} />
        </div>

        {/* Блок тижневої аналітики від ШІ-коуча [E6] */}
        <WeeklyCoachReport report={weeklyReport} />

        {/* Публічні челенджі профілю */}
        <div className="space-y-4"></div>

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

        {/* Стрічка останніх звітів користувача */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Proofs</h2>
          <ProofList proofs={recentProofs} />
        </div>
      </main>
    </div>
  );
}
