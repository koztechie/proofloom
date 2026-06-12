import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { LeaderboardTable } from "@/components/leaderboard-table"

export const metadata: Metadata = {
  title: "Leaderboard — ProofLoom",
}

export default function LeaderboardPage() {
  return (
    <AppShell>
      <div className="container flex flex-col gap-8 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">
            The most consistent builders, ranked by verified proof. Filter by
            category to find your competition.
          </p>
        </div>
        <LeaderboardTable />
      </div>
    </AppShell>
  )
}
