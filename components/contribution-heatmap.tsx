import { cn } from "@/lib/utils"

// Deterministic pseudo-random generator so the static grid is stable.
function seeded(index: number) {
  const x = Math.sin(index * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const levelClasses = [
  "bg-muted",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
]

const months = ["Jan", "Mar", "May", "Jul", "Sep", "Nov"]
const weekdays = ["Mon", "Wed", "Fri"]

type ContributionHeatmapProps = {
  weeks?: number
  className?: string
  showLabels?: boolean
}

export function ContributionHeatmap({
  weeks = 52,
  className,
  showLabels = true,
}: ContributionHeatmapProps) {
  const days = Array.from({ length: weeks * 7 }, (_, i) => {
    const r = seeded(i + 1)
    // Skew toward lower activity for a realistic look.
    const level = r > 0.82 ? 4 : r > 0.66 ? 3 : r > 0.46 ? 2 : r > 0.24 ? 1 : 0
    return level
  })

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-2">
        {showLabels && (
          <div className="hidden flex-col justify-between py-[2px] pr-1 text-[10px] text-muted-foreground sm:flex">
            {weekdays.map((d) => (
              <span key={d} className="leading-none">
                {d}
              </span>
            ))}
          </div>
        )}
        <div className="flex w-full gap-[3px] overflow-hidden">
          {Array.from({ length: weeks }, (_, w) => (
            <div key={w} className="flex flex-1 flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, d) => {
                const level = days[w * 7 + d] ?? 0;
                return (
                  <div
                    key={d}
                    className={cn(
                      "aspect-square w-full rounded-[2px]",
                      levelClasses[level],
                    )}
                    title={`${level} proofs`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex gap-8 pl-7">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span>Less</span>
            {levelClasses.map((c, i) => (
              <span key={i} className={cn("size-[10px] rounded-[2px]", c)} />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  )
}
