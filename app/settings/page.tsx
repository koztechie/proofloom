import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import SettingsForm from "./form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      {/* Безпечний серверний Header */}
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

        {/* Клієнтська форма налаштувань */}
        <SettingsForm />
      </main>
    </div>
  );
}
