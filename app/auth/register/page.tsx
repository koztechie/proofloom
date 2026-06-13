"use client";

import { useActionState } from "react";
import { registerUser } from "./actions";
import Link from "next/link";

export default function RegisterPage() {
  // Стандартний хук React 19 для обробки станів форм без додаткових бібліотек
  const [state, formAction, isPending] = useActionState(registerUser, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-50">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-100">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Or{" "}
            <Link
              href="/auth/login"
              className="font-medium text-emerald-500 hover:text-emerald-400"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          {state?.error && (
            <div className="rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-400">
              {state.error}
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Display Name (Optional)"
                className="relative block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <input
                id="handle"
                name="handle"
                type="text"
                required
                placeholder="Username (e.g. koztechie)"
                className="relative block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="relative block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                className="relative block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50"
            >
              {isPending ? "Creating account..." : "Get started"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
