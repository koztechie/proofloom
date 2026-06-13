'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Тут у продакшені помилка відправляється в систему моніторингу (Sentry)
    console.error('Captured Global Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl">
        <div className="w-16 h-16 bg-red-950/50 border border-red-800 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl text-red-500">⚠️</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-zinc-400">
            An unexpected error occurred while processing your request. System logs have been secured.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="flex-1 text-center rounded-lg border border-zinc-800 hover:bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-400 transition-colors"
          >
            Go Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
