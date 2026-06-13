export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-emerald-500">ProofLoom</span>
      </header>
      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded-lg"></div>
          <div className="h-4 w-96 bg-zinc-800/60 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-3">
              <div className="h-3 w-24 bg-zinc-800/80 animate-pulse rounded"></div>
              <div className="h-8 w-16 bg-zinc-800 animate-pulse rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-48 animate-pulse"></div>
          ))}
        </div>
      </main>
    </div>
  );
}
