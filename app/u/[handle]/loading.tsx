export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-emerald-500">ProofLoom</span>
      </header>
      <main className="max-w-4xl mx-auto px-6 mt-12 space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-20 h-20 bg-zinc-800 animate-pulse rounded-full"></div>
          <div className="space-y-3 w-48">
            <div className="h-8 w-full bg-zinc-800 animate-pulse rounded-lg"></div>
            <div className="h-4 w-2/3 bg-zinc-800/60 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
          <div className="h-6 w-36 bg-zinc-800 animate-pulse rounded"></div>
          <div className="h-32 bg-zinc-950 border border-dashed border-zinc-800 animate-pulse rounded-lg"></div>
        </div>
      </main>
    </div>
  );
}
