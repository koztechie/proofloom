import { ProofRecord } from "@/lib/dynamo/proofs";

interface EnrichedProof extends ProofRecord {
  skill_category: string;
}

interface ProofListProps {
  proofs: EnrichedProof[];
}

export default function ProofList({ proofs }: ProofListProps) {
  if (proofs.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <p className="text-zinc-500 text-sm">No proofs submitted yet.</p>
      </div>
    );
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70)
      return "text-emerald-400 bg-emerald-950/40 border-emerald-800/50";
    if (score >= 40)
      return "text-yellow-400 bg-yellow-950/40 border-yellow-800/50";
    return "text-red-400 bg-red-950/40 border-red-800/50";
  };

  return (
    <div className="space-y-4">
      {proofs.map((p) => {
        const dateStr = p.sk.split("#")[1];
        const formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        // Обрізаємо перші 150 символів для компактного відображення на картці профілю
        const truncatedText =
          p.proof_text.length > 150
            ? `${p.proof_text.substring(0, 150)}...`
            : p.proof_text;

        return (
          <div
            key={p.sk}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <span className="text-xs bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full text-zinc-300 font-semibold">
                  {p.skill_category}
                </span>
                <span className="text-xs text-zinc-500">{formattedDate}</span>
              </div>

              {/* AI Score Badge з динамічним кольором */}
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-md border ${getScoreBadgeColor(
                  p.ai_score,
                )}`}
              >
                AI Score: {p.ai_score}/100
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                {truncatedText}
              </p>

              {p.proof_url && (
                <a
                  href={p.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-500 hover:underline break-all block"
                >
                  Evidence Link: {p.proof_url}
                </a>
              )}

              {/* Вердикт штучного інтелекту */}
              <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/80">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
                  AI Feedback
                </p>
                <p className="text-xs italic text-zinc-300">"{p.ai_comment}"</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
