import Header from "@/components/Header";
import NewChallengeForm from "./form";

export default function NewChallengePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-12">
      {/* Безпечний виклик серверного хедера */}
      <Header />

      <main className="max-w-xl mx-auto px-6 mt-12">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Create new challenge
          </h1>
          <p className="text-sm text-zinc-400">
            Set a specific skill and target streak to commit to.
          </p>
        </div>

        {/* Виклик клієнтської форми */}
        <NewChallengeForm />
      </main>
    </div>
  );
}
