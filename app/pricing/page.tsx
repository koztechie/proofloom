import Link from "next/link"
import type { Metadata } from "next"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AppShell } from "@/components/app-shell"

export const metadata: Metadata = {
  title: "Pricing — ProofLoom",
}

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to start building in public.",
    cta: "Get started",
    href: "/auth/register",
    highlighted: false,
    features: [
      "1 active challenge",
      "Daily proof submissions",
      "AI verification (10 / month)",
      "Public profile + heatmap",
      "Leaderboard access",
    ],
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For serious builders who want unlimited momentum.",
    cta: "Start Pro trial",
    href: "/auth/register",
    highlighted: true,
    features: [
      "Unlimited active challenges",
      "Unlimited AI verifications",
      "Detailed score analytics",
      "Custom profile URL",
      "Priority AI evaluation",
      "Verified badge",
    ],
  },
  {
    name: "Team",
    price: "$29",
    period: "per month",
    description: "Keep your whole team accountable together.",
    cta: "Contact sales",
    href: "/auth/register",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared team leaderboard",
      "Team challenge templates",
      "Admin dashboard",
      "Priority support",
    ],
  },
]

const faqs = [
  {
    q: "How does AI verification work?",
    a: "Each proof you submit is scored 0–100 by an AI evaluator that compares your submission against the skill you're building, then leaves short feedback.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a free plan?",
    a: "Absolutely. The Free plan lets you run one challenge with daily proof submissions and a public profile, forever.",
  },
]

export default function PricingPage() {
  return (
    <AppShell>
      <div className="container flex flex-col gap-12 py-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple pricing for committed builders
          </h1>
          <p className="text-pretty text-muted-foreground">
            Start free and upgrade when you&apos;re ready. No hidden fees, cancel
            anytime.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                "flex flex-col",
                tier.highlighted && "border-primary shadow-sm",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  {tier.highlighted && <Badge>Most popular</Badge>}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="flex flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq) => (
              <Card key={faq.q}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {faq.a}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
