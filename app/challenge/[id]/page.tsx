import Link from "next/link"
import { ArrowLeft, CheckCircle2, Flame, LinkIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AppShell } from "@/components/app-shell"
import { challenges, recentProofs } from "@/lib/mock-data"

export function generateStaticParams() {
  return challenges.map((c) => ({ id: c.id }))
}

export default function ChallengePage({ params }: { params: { id: string } }) {
  const challenge =
    challenges.find((c) => c.id === params.id) ?? challenges[0]
  const progress = Math.round(
    (challenge.daysCompleted / challenge.target) * 100,
  )

  return (
    <AppShell>
      <div className="container flex flex-col gap-8 py-10">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
            <Link href="/dashboard">
              <ArrowLeft data-icon="inline-start" />
              Back to dashboard
            </Link>
          </Button>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{challenge.category}</Badge>
              <Badge variant="outline" className="gap-1">
                <Flame className="size-3 text-primary" />
                {challenge.streak} day streak
              </Badge>
              <Badge variant="outline">Avg score {challenge.avgScore}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {challenge.title}
            </h1>
            <p className="text-muted-foreground">{challenge.description}</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Day {challenge.daysCompleted} of {challenge.target}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Proof submission form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Submit today&apos;s proof</CardTitle>
              <CardDescription>
                Describe what you did today. Add a link if you have evidence. Our
                AI evaluator will score your submission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proof">What did you accomplish?</Label>
                  <Textarea
                    id="proof"
                    rows={6}
                    placeholder="Today I built..."
                    className="resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="url">Evidence link (optional)</Label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://github.com/you/project"
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-fit">
                  <Sparkles data-icon="inline-start" />
                  Submit for AI verification
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Today's status */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Today</CardTitle>
              <CardDescription>
                Submit before midnight to keep your streak.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-3">
                <CheckCircle2 className="size-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Streak active</span>
                  <span className="text-xs text-muted-foreground">
                    Last proof submitted {challenge.lastProof.toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current streak</span>
                <span className="font-medium">{challenge.streak} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Days remaining</span>
                <span className="font-medium">
                  {Math.max(challenge.target - challenge.daysCompleted, 0)} days
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proof history */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Proof history</h2>
          <div className="flex flex-col gap-4">
            {recentProofs.map((proof) => (
              <Card key={proof.id}>
                <CardContent className="flex flex-col gap-3 pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Day {proof.day}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {proof.date}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="gap-1.5 font-mono text-primary"
                    >
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
                  <Separator />
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="leading-relaxed">{proof.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
