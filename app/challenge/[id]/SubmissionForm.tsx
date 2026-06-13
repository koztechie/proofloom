"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProofRecord } from "@/lib/dynamo/proofs";

interface SubmissionFormProps {
  challengeId: string;
  initialProof: ProofRecord | null;
  nextStreak: number;
}

export default function SubmissionForm({
  challengeId,
  initialProof,
  nextStreak,
}: SubmissionFormProps) {
  const router = useRouter();
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeProof, setActiveProof] = useState<ProofRecord | null>(
    initialProof,
  );
  const [showAnimation, setShowAnimation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (proofText.trim().length < 50) {
      setError(
        "Proof text must be at least 50 characters long to demonstrate actual effort.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/proofs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          proofText: proofText.trim(),
          proofUrl: proofUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setActiveProof({
        pk: "",
        sk: "",
        challenge_id: challengeId,
        proof_text: proofText,
        proof_url: proofUrl || null,
        streak_day: data.streakDay,
        ai_score: data.score,
        ai_comment: data.comment,
        submitted_at: new Date().toISOString(),
      });

      setShowAnimation(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeProof) {
    return (
      <div
        className={`space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl transition-all duration-1000 transform ${showAnimation ? "scale-105 border-emerald-500/50" : ""}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            <p className="text-sm font-bold text-emerald-400">
              ✓ Completed Today
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">AI Score</p>
            <span
              className={`inline-block text-lg font-black px-3 py-1 rounded-lg ${
                activeProof.ai_score >= 70
                  ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800"
                  : activeProof.ai_score >= 40
                    ? "bg-yellow-950/50 text-yellow-400 border border-yellow-800"
                    : "bg-red-950/50 text-red-400 border border-red-800"
              }`}
            >
              {activeProof.ai_score}/100
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Your Submission</p>
            <p className="text-sm text-zinc-200 bg-zinc-950 p-4 rounded-lg border border-zinc-800/50 whitespace-pre-wrap">
              {activeProof.proof_text}
            </p>
          </div>

          {activeProof.proof_url && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Evidence URL</p>
              <a
                href={activeProof.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-500 hover:underline break-all"
              >
                {activeProof.proof_url}
              </a>
            </div>
          )}

          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">AI Evaluator Feedback</p>
            <p className="text-sm italic text-zinc-300">
              "{activeProof.ai_comment}"
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500">
            Streak updated to{" "}
            <span className="font-bold text-emerald-400">
              {activeProof.streak_day} days
            </span>
            . Come back tomorrow!
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl"
    >
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="proofText"
            className="block text-sm font-semibold text-zinc-300 mb-2"
          >
            What did you build/practice today? (Minimum 50 characters)
          </label>
          <textarea
            id="proofText"
            rows={6}
            required
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            placeholder="Describe your progress today in detail."
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
          />
          <p className="text-xs text-zinc-500 mt-2 flex justify-between">
            <span>Provide code-level or specific practice details.</span>
            <span
              className={
                proofText.trim().length >= 50
                  ? "text-emerald-500"
                  : "text-zinc-500"
              }
            >
              {proofText.trim().length}/50 chars
            </span>
          </p>
        </div>

        <div>
          <label
            htmlFor="proofUrl"
            className="block text-sm font-semibold text-zinc-300 mb-2"
          >
            Evidence URL (Optional)
          </label>
          <input
            id="proofUrl"
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="e.g. https://github.com/..."
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || proofText.trim().length < 50}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50"
      >
        {isSubmitting
          ? "Evaluating with AI..."
          : `Submit Proof (Streak will become ${nextStreak} days)`}
      </button>
    </form>
  );
}
