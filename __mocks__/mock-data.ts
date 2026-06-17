export type Challenge = {
  id: string
  title: string
  category: string
  description: string
  streak: number
  target: number
  daysCompleted: number
  avgScore: number
  status: "active" | "completed"
  lastProof: string
}

export const challenges: Challenge[] = [
  {
    id: "1",
    title: "Ship a TypeScript project daily",
    category: "Engineering",
    description: "Build and push something with TypeScript every single day.",
    streak: 48,
    target: 100,
    daysCompleted: 48,
    avgScore: 87,
    status: "active",
    lastProof: "Today",
  },
  {
    id: "2",
    title: "Daily algorithm practice",
    category: "Engineering",
    description: "Solve at least one non-trivial algorithm problem per day.",
    streak: 12,
    target: 30,
    daysCompleted: 12,
    avgScore: 79,
    status: "active",
    lastProof: "Yesterday",
  },
  {
    id: "3",
    title: "Write 300 words on design",
    category: "Writing",
    description: "Publish a short essay or note about product design.",
    streak: 0,
    target: 60,
    daysCompleted: 21,
    avgScore: 82,
    status: "active",
    lastProof: "3 days ago",
  },
  {
    id: "4",
    title: "365 days of sketching",
    category: "Design",
    description: "One finished sketch every day for a full year.",
    streak: 365,
    target: 365,
    daysCompleted: 365,
    avgScore: 91,
    status: "completed",
    lastProof: "Completed",
  },
]

export type Proof = {
  id: string
  day: number
  date: string
  summary: string
  url?: string
  score: number
  feedback: string
}

export const recentProofs: Proof[] = [
  {
    id: "p1",
    day: 48,
    date: "Jun 12, 2026",
    summary:
      "Built a small CLI in TypeScript that parses markdown front-matter and validates schema with zod.",
    url: "https://github.com/devloom/md-validate",
    score: 92,
    feedback:
      "Strong proof. Clear scope, working code linked, and the zod schema demonstrates real TypeScript depth.",
  },
  {
    id: "p2",
    day: 47,
    date: "Jun 11, 2026",
    summary:
      "Refactored a React hook into a generic utility and added unit tests with Vitest.",
    url: "https://github.com/devloom/use-async",
    score: 88,
    feedback: "Good evidence of testing discipline. Consider showing before/after next time.",
  },
  {
    id: "p3",
    day: 46,
    date: "Jun 10, 2026",
    summary: "Wrote a type-safe fetch wrapper and documented the generics.",
    score: 81,
    feedback: "Solid, but a linked repo would strengthen the proof.",
  },
]

export type LeaderboardEntry = {
  rank: number
  handle: string
  name: string
  category: string
  streak: number
  proofs: number
  avgScore: number
}

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, handle: "anya", name: "Anya Petrova", category: "Engineering", streak: 211, proofs: 211, avgScore: 94 },
  { rank: 2, handle: "devloom", name: "Dev Loom", category: "Engineering", streak: 48, proofs: 312, avgScore: 89 },
  { rank: 3, handle: "marco", name: "Marco Vidal", category: "Design", streak: 180, proofs: 188, avgScore: 88 },
  { rank: 4, handle: "lin", name: "Lin Zhao", category: "Writing", streak: 96, proofs: 140, avgScore: 86 },
  { rank: 5, handle: "sam", name: "Sam Okoro", category: "Engineering", streak: 64, proofs: 120, avgScore: 85 },
  { rank: 6, handle: "yuki", name: "Yuki Tanaka", category: "Design", streak: 41, proofs: 98, avgScore: 84 },
  { rank: 7, handle: "noor", name: "Noor Haddad", category: "Writing", streak: 30, proofs: 77, avgScore: 83 },
  { rank: 8, handle: "kai", name: "Kai Bauer", category: "Fitness", streak: 120, proofs: 120, avgScore: 82 },
]

export const categories = ["All", "Engineering", "Design", "Writing", "Fitness"]
