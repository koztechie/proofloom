import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

// geist@1.0.0 uses the legacy @next/font API which is incompatible with Next.js 16.
// We load the woff2 files directly via next/font/local instead.
const GeistSans = localFont({
  src: [
    { path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Thin.woff2", weight: "100", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-sans/Geist-UltraLight.woff2", weight: "200", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Light.woff2", weight: "300", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Medium.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.woff2", weight: "700", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-geist-sans",
})

const GeistMono = localFont({
  src: [
    { path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Thin.woff2", weight: "100", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Light.woff2", weight: "300", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Bold.woff2", weight: "700", style: "normal" },
    { path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://proofloom.vercel.app"),
  title: {
    default: "ProofLoom — AI-Verified Skill Tracker",
    template: "%s | ProofLoom",
  },
  description:
    "Build skills in public. Submit daily proof, get AI verification, and climb the leaderboard. ProofLoom turns consistency into a verifiable track record.",
  keywords: ["developer habits", "skill tracking", "AWS databases", "Vercel", "Bedrock"],
  openGraph: {
    siteName: "ProofLoom",
    locale: "en_US",
    type: "website",
    images: [{ url: "/logo.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
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
