import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import { getChallengeById } from "@/lib/db/challenges";
import { getProofsByHandle } from "@/lib/dynamo/proofs";
import { getCurrentStreak } from "@/lib/dynamo/streaks";
import ChallengeForm from "@/components/features/challenge/ChallengeForm";
import Link from "next/link";
import Header from "@/components/Header";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const challenge = await getChallengeById(id);

  if (!challenge) {
    return {
      title: "Challenge Not Found",
      description: "The requested challenge does not exist.",
    };
  }

  const title = challenge.title;
  const description = `Join the ${challenge.skill_category} challenge: ${challenge.title}. Track your progress and build a verifiable track record on ProofLoom.`;

  return {
    title,
    description,
    keywords: [challenge.skill_category, "challenge", "skill tracking"],
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ChallengePage({ params }: PageProps) {
  // requireAuth() redirects to /auth/login if no valid session is found,
  // and also rejects disabled accounts (isActive = false).
  const user = await requireAuth();

  // CRITICAL FOR NEXT.JS 16: params is a Promise and must be awaited
  const { id } = await params;

  // 1. Fetch challenge data from Aurora PostgreSQL
  const challenge = await getChallengeById(id);
  if (!challenge || challenge.user_id !== user.id) {
    notFound();
  }

  const handle = user.handle;

  // 2. Паралельно отримуємо історію звітів та поточний стрік з DynamoDB
  const [proofs, currentStreak] = await Promise.all([
    getProofsByHandle(handle),
    getCurrentStreak(handle),
  ]);

  // 3. Перевіряємо, чи користувач уже надсилав звіт на цей челендж сьогодні
  const todayStr = new Date().toISOString().split("T")[0];
  const todayProof = proofs.find(
    (p) => p.sk === `PROOF#${todayStr}` && p.challenge_id === challenge.id,
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      {/* Шапка */}
      <Header />

      <main className="max-w-2xl mx-auto px-6 mt-12">
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-xs bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full text-zinc-300 font-semibold">
              {challenge.skill_category}
            </span>
            <span className="text-sm font-semibold text-emerald-400">
              Current Streak: {currentStreak} days
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {challenge.title}
          </h1>
          <p className="text-sm text-zinc-400">
            Today is{" "}
            <span className="font-semibold text-zinc-200">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>

        {/* Рендеримо клієнтську форму, передаючи початкові дані про звіт */}
        <ChallengeForm
          challengeId={challenge.id}
          initialProof={todayProof || null}
          nextStreak={currentStreak + (todayProof ? 0 : 1)}
        />
      </main>
    </div>
  );
}
