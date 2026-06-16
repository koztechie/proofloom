"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfileSettings } from "./actions";
import Header from "@/components/Header";

export default function SettingsPage() {
  const [state, formAction, isPending] = useActionState(
    updateProfileSettings,
    null,
  );
  const [userData, setUserData] = useState<any>(null);

  // Завантажуємо поточні дані користувача для заповнення форми
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.user) {
        // Отримуємо повні дані профілю з нашого API роуту
        const userRes = await fetch(`/api/users/me`);
        if (userRes.ok) {
          const fullUser = await userRes.json();
          setUserData(fullUser);
        }
      }
    }
    fetchUser();
  }, [state]);

  if (!userData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      <Header />
      <main className="max-w-2xl mx-auto px-6 mt-12 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Customize your public developer profile identity.
          </p>
        </div>

        <form
          action={formAction}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl space-y-6 shadow-2xl"
        >
          {state?.error && (
            <div className="rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-400">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="rounded-lg border border-emerald-900 bg-emerald-950/50 p-4 text-sm text-emerald-400">
              ✓ Changes saved successfully!
            </div>
          )}

          <div className="space-y-6">
            {/* Аватар */}
            <div>
              <label
                htmlFor="avatarType"
                className="block text-sm font-semibold text-zinc-300 mb-2"
              >
                Avatar Style
              </label>
              <select
                id="avatarType"
                name="avatarType"
                defaultValue={userData.avatar_type || "initials"}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              >
                <option value="initials">Dynamic Initials (Two Letters)</option>
                <option value="gravatar">
                  Secure Gravatar (Linked to your email)
                </option>
              </select>
            </div>

            {/* Публічне Ім'я */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-semibold text-zinc-300 mb-2"
              >
                Display Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                defaultValue={userData.display_name || ""}
                placeholder="e.g. Євгеній Козловський"
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>

            {/* Біографія */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-semibold text-zinc-300 mb-2"
              >
                Bio / Description
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                defaultValue={userData.bio || ""}
                placeholder="Tell the world what you are building..."
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>

            {/* Локація */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-semibold text-zinc-300 mb-2"
              >
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                defaultValue={userData.location || ""}
                placeholder="e.g. Kyiv, Ukraine"
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>

            {/* Веб-сайт */}
            <div>
              <label
                htmlFor="websiteUrl"
                className="block text-sm font-semibold text-zinc-300 mb-2"
              >
                Website URL
              </label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                defaultValue={userData.website_url || ""}
                placeholder="https://koztechie.pp.ua"
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>

            {/* Соціальні мережі */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="githubUrl"
                  className="block text-xs font-semibold text-zinc-400 mb-2"
                >
                  GitHub URL
                </label>
                <input
                  id="githubUrl"
                  name="githubUrl"
                  type="url"
                  defaultValue={userData.github_url || ""}
                  placeholder="https://github.com/..."
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="twitterUrl"
                  className="block text-xs font-semibold text-zinc-400 mb-2"
                >
                  Twitter URL
                </label>
                <input
                  id="twitterUrl"
                  name="twitterUrl"
                  type="url"
                  defaultValue={userData.twitter_url || ""}
                  placeholder="https://twitter.com/..."
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="linkedinUrl"
                  className="block text-xs font-semibold text-zinc-400 mb-2"
                >
                  LinkedIn URL
                </label>
                <input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  defaultValue={userData.linkedin_url || ""}
                  placeholder="https://linkedin.com/in/..."
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
