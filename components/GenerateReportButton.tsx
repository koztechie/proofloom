"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateReportButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleTrigger = async () => {
    setIsPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reports/generate-now", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate report.");
      }

      setMessage("✓ AI Report Generated!");
      router.refresh(); // Оновлюємо кеш Next.js, щоб звіт миттєво з'явився у профілі
    } catch (err: any) {
      setMessage(`⚠️ ${err.message}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end space-y-1">
      <button
        onClick={handleTrigger}
        disabled={isPending}
        className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold px-4 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all disabled:opacity-50"
      >
        {isPending ? "🔄 Analyzing Week..." : "⚡ Generate Weekly Report Now"}
      </button>
      {message && (
        <span
          className={`text-[10px] font-bold ${message.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
