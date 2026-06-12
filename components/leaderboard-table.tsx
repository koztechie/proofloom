"use client"

import Link from "next/link"
import { Flame, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { categories, leaderboard, type LeaderboardEntry } from "@/lib/mock-data"

const rankColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-zinc-400",
  3: "text-amber-700",
}

export function LeaderboardTable() {
  return (
    <Tabs defaultValue="All" className="flex flex-col gap-6">
      <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
        {categories.map((category) => (
          <TabsTrigger key={category} value={category}>
            {category}
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => {
        const rows =
          category === "All"
            ? leaderboard
            : leaderboard.filter((e) => e.category === category)
        return <TabContent key={category} value={category} rows={rows} />
      })}
    </Tabs>
  )
}

function TabContent({
  value,
  rows,
}: {
  value: string
  rows: LeaderboardEntry[]
}) {
  return (
    <TabsContent value={value} className="mt-0 flex flex-col gap-2">
      <div className="hidden grid-cols-[48px_1fr_120px_100px_80px] items-center gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
        <span>Rank</span>
        <span>Builder</span>
        <span>Category</span>
        <span className="text-right">Proofs</span>
        <span className="text-right">Avg</span>
      </div>

      {rows.map((entry) => (
        <Link
          key={entry.handle}
          href={`/u/${entry.handle}`}
          className="grid grid-cols-[48px_1fr_auto] items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/50 sm:grid-cols-[48px_1fr_120px_100px_80px]"
        >
          <span
            className={cn(
              "flex items-center gap-1 font-mono text-sm font-semibold",
              rankColors[entry.rank] ?? "text-muted-foreground",
            )}
          >
            {entry.rank <= 3 && <Medal className="size-4" />}
            {entry.rank}
          </span>

          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {entry.handle.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{entry.name}</span>
              <span className="text-xs text-muted-foreground">@{entry.handle}</span>
            </div>
          </div>

          <div className="hidden sm:block">
            <Badge variant="secondary">{entry.category}</Badge>
          </div>

          <span className="hidden text-right text-sm sm:block">{entry.proofs}</span>

          <Badge variant="outline" className="gap-1 justify-self-end font-mono">
            <Flame className="size-3 text-primary" />
            {entry.avgScore}
          </Badge>
        </Link>
      ))}
    </TabsContent>
  )
}
