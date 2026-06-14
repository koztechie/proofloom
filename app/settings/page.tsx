import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      <Header />
      <main className="max-w-2xl mx-auto px-6 mt-12 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Manage your account preferences and personal information.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl space-y-6 shadow-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Username
              </label>
              <input
                disabled
                value={`@${session.user.handle}`}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3 text-zinc-500 cursor-not-allowed sm:text-sm"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Usernames cannot be changed once created to preserve streak
                integrity.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Email address
              </label>
              <input
                disabled
                value={session.user.email || ""}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3 text-zinc-500 cursor-not-allowed sm:text-sm"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Contact support to update your billing email.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex justify-end">
            <button
              disabled
              className="rounded-lg bg-emerald-600/50 px-6 py-2.5 text-sm font-semibold text-white/50 cursor-not-allowed"
            >
              Save changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
