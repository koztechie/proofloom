import Link from "next/link"
import { Logo } from "@/components/shared/logo"

const footerLinks = [
  {
    title: "Product",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/auth/login", label: "Sign in" },
      { href: "/auth/register", label: "Create account" },
      { href: "/u/devloom", label: "Example profile" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/", label: "How it works" },
      { href: "/", label: "Documentation" },
      { href: "/", label: "Changelog" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col gap-10 py-12 md:flex-row md:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-6" />
            <span className="font-semibold tracking-tight">ProofLoom</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            AI-verified skill tracking. Show up daily, submit proof, and build a
            track record that speaks for itself.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerLinks.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-foreground">{group.title}</h3>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ProofLoom. All rights reserved.</p>
          <p>Built for the H0 Hackathon.</p>
        </div>
      </div>
    </footer>
  )
}
