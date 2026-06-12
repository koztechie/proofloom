import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "ProofLoom — AI-Verified Skill Tracking",
  description:
    "Build skills in public. Submit daily proof, get AI verification, and climb the leaderboard. ProofLoom turns consistency into a verifiable track record.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-background font-sans antialiased">{children}</body>
    </html>
  )
}
