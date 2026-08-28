import { cn } from '../../lib/cn'

export function ActivityRing({ progress, label }: { progress: number; label: string }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const percentage = Math.round(progress * 100)

  return (
    <div className={cn('relative size-28', progress >= 1 && 'activity-ring-complete')} role="img" aria-label={`${label}: ${percentage}%`}>
      <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 112 112" fill="none">
        <circle cx="56" cy="56" r={radius} stroke="var(--muted)" strokeWidth="12" />
        <circle
          className="transition-[stroke-dashoffset] duration-300"
          cx="56"
          cy="56"
          r={radius}
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <strong className="absolute inset-0 grid place-items-center font-mono text-heading-2 tabular-nums text-card-foreground">{percentage}%</strong>
    </div>
  )
}
