import Header from "@/components/Header";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Flame,
  LayoutGrid,
  LineChart,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { ContributionHeatmap } from "@/components/contribution-heatmap";

const features = [
  {
    icon: Bot,
    title: "AI proof verification",
    description:
      "Every submission is scored 0–100 by an AI evaluator that checks your proof against the skill you're building.",
  },
  {
    icon: CalendarCheck,
    title: "Daily proof streaks",
    description:
      "Commit to a 7–365 day challenge. Submit text or a link each day and keep your streak alive.",
  },
  {
    icon: LayoutGrid,
    title: "Contribution heatmap",
    description:
      "A GitHub-style activity grid on your public profile shows the world your consistency at a glance.",
  },
  {
    icon: Trophy,
    title: "Global leaderboard",
    description:
      "Rank against other builders by category and prove you're putting in the reps that matter.",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable track record",
    description:
      "Your profile is a public, tamper-evident record of the work you've actually done.",
  },
  {
    icon: LineChart,
    title: "Progress insights",
    description:
      "See score trends, completion rate, and momentum across every challenge you take on.",
  },
];

const steps = [
  {
    step: "01",
    title: "Start a challenge",
    description: "Pick a skill and a target streak from 7 to 365 days.",
  },
  {
    step: "02",
    title: "Submit daily proof",
    description: "Drop a short writeup and an optional link as evidence.",
  },
  {
    step: "03",
    title: "Get AI verified",
    description: "Receive a score and feedback, then climb the leaderboard.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border">
          <div className="container flex flex-col items-center gap-8 py-20 text-center md:py-28">
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full px-3 py-1"
            >
              <Flame className="size-3.5 text-primary" />
              Build skills in public
            </Badge>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Turn daily effort into a{" "}
              <span className="text-primary">verifiable</span> track record
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              ProofLoom is an AI-verified skill tracker. Commit to a challenge,
              submit proof every day, and let the work speak for itself on a
              public profile.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Start building
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/u/devloom">View example profile</Link>
              </Button>
            </div>

            {/* Heatmap preview */}
            <Card className="mt-8 w-full max-w-3xl text-left">
              <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base">
                    312 proofs this year
                  </CardTitle>
                  <CardDescription>
                    Consistency compounds. Here&apos;s what a year looks like.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1.5">
                  <Flame className="size-3.5 text-primary" />
                  48 day streak
                </Badge>
              </CardHeader>
              <CardContent>
                <ContributionHeatmap />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border">
          <div className="container py-20">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you need to prove you did the work
              </h2>
              <p className="text-pretty text-muted-foreground">
                ProofLoom combines accountability, AI verification, and public
                proof into one clean workflow.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="h-full">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-md bg-secondary">
                      <feature.icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-border">
          <div className="container py-20">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Three steps to a proven streak
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((item) => (
                <div key={item.step} className="flex flex-col gap-3">
                  <span className="font-mono text-sm text-primary">
                    {item.step}
                  </span>
                  <h3 className="text-xl font-medium">{item.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="container py-20">
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center gap-6 py-14 text-center">
                <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your next skill is one daily proof away
                </h2>
                <p className="max-w-lg text-pretty text-muted-foreground">
                  Join builders who show up every day. Start your first
                  challenge in under a minute.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/auth/register">
                      Create your account
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/pricing">See pricing</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
