import Link from "next/link"
import { CalendarDays, Flame, LinkIcon, MapPin, Sparkles, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AppShell } from "@/components/app-shell"
import { ContributionHeatmap } from "@/components/contribution-heatmap"
import { recentProofs } from "@/lib/mock-data"

export function generateMetadata({ params }: { params: { handle: string } }) {
  return {
    title: `@${params.handle} — ProofLoom`,
  }
}

const profileStats = [
  { label: "Total proofs", value: "312" },
  { label: "Current streak", value: "48" },
  { label: "Longest streak", value: "96" },
  { label: "Avg score", value: "89" },
]

const activeChallenges = [
  { title: "Ship a TypeScript project daily", category: "Engineering", streak: 48 },
  { title: "Daily algorithm practice", category: "Engineering", streak: 12 },
  { title: "365 days of sketching", category: "Design", streak: 365 },
]

export default function ProfilePage({ params }: { params: { handle: string } }) {
  const handle = params.handle

  return (
    <AppShell>
      <div className="container flex flex-col gap-8 py-10 lg:flex-row">
        {/* Sidebar */}
        <aside className="flex w-full flex-col gap-6 lg:w-72 lg:shrink-0">
          <div className="flex flex-col gap-4">
            <Avatar className="size-24">
              <AvatarFallback className="bg-secondary text-2xl font-semibold">
                {handle.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight">Dev Loom</h1>
              <p className="text-muted-foreground">@{handle}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Building in public, one verified proof at a time. Engineer focused
              on TypeScript and developer tools.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="size-4" />
                Lisbon, Portugal
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                Joined March 2026
              </span>
              <Link
                href="/u/devloom"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <LinkIcon className="size-4" />
                devloom.dev
              </Link>
            </div>
            <Badge variant="outline" className="w-fit gap-1.5">
              <Trophy className="size-3.5 text-primary" />
              Ranked #2 globally
            </Badge>
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profileStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex flex-col gap-1 pt-6">
                  <span className="text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Heatmap */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">312 proofs in the last year</CardTitle>
              <Badge variant="outline" className="gap-1.5">
                <Flame className="size-3.5 text-primary" />
                48 day streak
              </Badge>
            </CardHeader>
            <CardContent>
              <ContributionHeatmap />
            </CardContent>
          </Card>

          {/* Active challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active challenges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {activeChallenges.map((c, i) => (
                <div key={c.title}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{c.title}</span>
                      <Badge variant="secondary" className="w-fit">
                        {c.category}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="gap-1 shrink-0">
                      <Flame className="size-3 text-primary" />
                      {c.streak}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent proofs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent proofs</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {recentProofs.map((proof, i) => (
                <div key={proof.id} className="flex flex-col gap-3">
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Day {proof.day}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {proof.date}
                      </span>
                    </div>
                    <Badge variant="outline" className="gap-1.5 font-mono text-primary">
                      {proof.score}
                      <span className="text-muted-foreground">/100</span>
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed">{proof.summary}</p>
                  {proof.url && (
                    <Link
                      href={proof.url}
                      className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <LinkIcon className="size-3.5" />
                      {proof.url.replace("https://", "")}
                    </Link>
                  )}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="leading-relaxed">{proof.feedback}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
