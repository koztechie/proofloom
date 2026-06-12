import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Flame, Plus, Target, TrendingUp, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AppShell } from "@/components/app-shell"
import { challenges } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: "Dashboard — ProofLoom",
}

const stats = [
  { label: "Active challenges", value: "3", icon: Target },
  { label: "Current best streak", value: "48 days", icon: Flame },
  { label: "Average score", value: "85", icon: TrendingUp },
  { label: "Leaderboard rank", value: "#2", icon: Trophy },
]

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="container flex flex-col gap-8 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Your challenges</h1>
            <p className="text-muted-foreground">
              Welcome back. Keep your streaks alive and your proof flowing.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              <Plus data-icon="inline-start" />
              New challenge
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex size-10 items-center justify-center rounded-md bg-secondary">
                  <stat.icon className="size-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Challenge list */}
        <div className="grid gap-4 md:grid-cols-2">
          {challenges.map((challenge) => {
            const progress = Math.round(
              (challenge.daysCompleted / challenge.target) * 100,
            )
            return (
              <Card key={challenge.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{challenge.category}</Badge>
                        {challenge.status === "completed" ? (
                          <Badge variant="outline" className="text-primary">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Flame className="size-3 text-primary" />
                            {challenge.streak} day streak
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {challenge.daysCompleted} / {challenge.target} days
                      </span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Avg score{" "}
                      <span className="font-medium text-foreground">
                        {challenge.avgScore}
                      </span>{" "}
                      · Last proof {challenge.lastProof}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/challenge/${challenge.id}`}>
                        Open
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
