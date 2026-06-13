'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Captured Dashboard Error:', error);
  }, [error]);

  return (
    <div className="max-w-6xl mx-auto px-6 mt-12">
      <div className="bg-zinc-900 border border-red-950/30 p-8 rounded-xl space-y-6 text-center max-w-lg mx-auto shadow-2xl">
        <div className="w-12 h-12 bg-red-950/30 border border-red-900/50 rounded-full flex items-center justify-center mx-auto text-red-500 font-bold">
          !
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-100">Failed to load dashboard data</h2>
          <p className="text-xs text-zinc-400">
            There was a temporary issue communicating with AWS services. Please verify your connection.
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
