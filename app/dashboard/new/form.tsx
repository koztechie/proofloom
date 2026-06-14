"use client";

import { useActionState } from "react";
import { createChallengeAction } from "./actions";
import Link from "next/link";

const CATEGORIES = [
  "SQL",
  "Python",
  "JavaScript",
  "Web Dev",
  "Writing",
  "Design",
  "Fitness",
  "Other",
];

export default function NewChallengeForm() {
  const [state, formAction, isPending] = useActionState(
    createChallengeAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl"
    >
      {state?.error && (
        <div className="rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-zinc-300 mb-2"
          >
            Challenge Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Master SQL Joins and Performance"
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="skillCategory"
            className="block text-sm font-semibold text-zinc-300 mb-2"
          >
            Skill Category
          </label>
          <select
            id="skillCategory"
            name="skillCategory"
            required
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="targetDays"
            className="block text-sm font-semibold text-zinc-300 mb-2"
          >
            Target Days (Streak)
          </label>
          <input
            id="targetDays"
            name="targetDays"
            type="number"
            required
            min="7"
            max="365"
            defaultValue="30"
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Commit to a streak from 7 to 365 days.
          </p>
        </div>

        <div>
          <label
            htmlFor="isPublic"
            className="block text-sm font-semibold text-zinc-300 mb-2"
          >
            Visibility
          </label>
          <select
            id="isPublic"
            name="isPublic"
            required
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
          >
            <option value="true">
              Public (Visible on your profile and leaderboard)
            </option>
            <option value="false">Private (Only visible to you)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4 pt-4">
        <Link
          href="/dashboard"
          className="flex-1 text-center rounded-lg border border-zinc-800 hover:bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-400 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Challenge"}
        </button>
      </div>
    </form>
  );
}
