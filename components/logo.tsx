export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" className="fill-primary" />
      <path
        d="M8 8.5h5.5a2.5 2.5 0 0 1 0 5H8m0 0v3m0-3V8.5m3 5 3 3"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
