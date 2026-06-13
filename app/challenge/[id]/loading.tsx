export default function ChallengeLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-emerald-500">ProofLoom</span>
      </header>
      <main className="max-w-2xl mx-auto px-6 mt-12 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-5 w-20 bg-zinc-800 animate-pulse rounded-full"></div>
            <div className="h-5 w-32 bg-zinc-800 animate-pulse rounded"></div>
          </div>
          <div className="h-8 w-3/4 bg-zinc-800 animate-pulse rounded-lg"></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl h-[320px] animate-pulse"></div>
      </main>
    </div>
  );
}
