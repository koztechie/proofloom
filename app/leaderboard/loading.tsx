export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-emerald-500">ProofLoom</span>
      </header>
      <main className="max-w-4xl mx-auto px-6 mt-12 space-y-8">
        <div className="space-y-3">
          <div className="h-8 w-40 bg-zinc-800 animate-pulse rounded-lg"></div>
          <div className="h-4 w-96 bg-zinc-800/60 animate-pulse rounded"></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900/50 animate-pulse"></div>
          ))}
        </div>
      </main>
    </div>
  );
}
