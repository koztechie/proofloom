import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getChallengeById } from "@/lib/db/challenges";
import { getProofsByHandle } from "@/lib/dynamo/proofs";
import { getCurrentStreak } from "@/lib/dynamo/streaks";
import SubmissionForm from "./SubmissionForm";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.handle) {
    redirect("/auth/login");
  }

  // КРИТИЧНО ДЛЯ NEXT.JS 16: params є промісом, його обов'язково авейтити
  const { id } = await params;

  // 1. Отримуємо дані про челендж з Aurora PostgreSQL
  const challenge = await getChallengeById(id);
  if (!challenge || challenge.user_id !== session.user.id) {
    notFound();
  }

  const handle = session.user.handle;

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
        <span className="text-sm text-zinc-400">@{handle}</span>
      </header>

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
        <SubmissionForm
          challengeId={challenge.id}
          initialProof={todayProof || null}
          nextStreak={currentStreak + (todayProof ? 0 : 1)}
        />
      </main>
    </div>
  );
}
