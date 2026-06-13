import { cn } from "@/lib/utils"

export type ContributionDay = {
  date: string
  score: number
}

type ContributionCalendarProps = {
  data: ContributionDay[]
  className?: string
}

const TOTAL_DAYS = 364
const WEEKS = 52
const DAYS_PER_WEEK = 7

// Map a 0-100 score to the appropriate Tailwind background class.
function scoreToClass(score: number): string {
  if (score <= 0) return "bg-zinc-800"
  if (score <= 40) return "bg-emerald-950"
  if (score <= 70) return "bg-emerald-700"
  return "bg-emerald-400"
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
})

function formatDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return dateFormatter.format(parsed)
}

const legendClasses = [
  "bg-zinc-800",
  "bg-emerald-950",
  "bg-emerald-700",
  "bg-emerald-400",
]

export function ContributionCalendar({
  data,
  className,
}: ContributionCalendarProps) {
  // Normalize to exactly 364 entries so the grid is always complete.
  const days: ContributionDay[] = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    return data[i] ?? { date: "", score: 0 }
  })

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto pb-2">
        {/* Sequential vertical columns: 52 weeks left to right, 7 days top to bottom */}
        <div className="flex w-max gap-1">
          {Array.from({ length: WEEKS }, (_, week) => (
            <div key={week} className="flex flex-col gap-1">
              {Array.from({ length: DAYS_PER_WEEK }, (_, day) => {
                const index = week * DAYS_PER_WEEK + day
                const cell = days[index]
                const hasDate = cell.date !== ""
                const label = hasDate
                  ? `${formatDate(cell.date)} — ${cell.score} ${
                      cell.score === 1 ? "point" : "points"
                    }`
                  : "No activity"

                return (
                  <div
                    key={day}
                    className="group/cell relative"
                  >
                    <div
                      className={cn(
                        "size-3 rounded-[2px] ring-1 ring-inset ring-white/5 transition-colors",
                        scoreToClass(cell.score),
                      )}
                    />
                    {/* CSS-only tooltip (no external library to avoid hydration mismatches) */}
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 scale-95 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-100 opacity-0 shadow-lg transition-all duration-100 group-hover/cell:scale-100 group-hover/cell:opacity-100"
                    >
                      {label}
                      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <span>Less</span>
        {legendClasses.map((c) => (
          <span
            key={c}
            className={cn("size-3 rounded-[2px] ring-1 ring-inset ring-white/5", c)}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
