import { cn } from '../../lib/cn'

export function ActivityRing({ progress, label, compact = false }: { progress: number; label: string; compact?: boolean }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const safeProgress = Math.max(0, Math.min(progress, 1))
  const percentage = Math.round(Math.max(0, progress) * 100)

  return (
    <div className={cn('relative', compact ? 'size-16' : 'size-28', progress >= 1 && 'activity-ring-complete')} role="img" aria-label={`${label}: ${percentage}%`}>
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
          strokeDashoffset={circumference * (1 - safeProgress)}
        />
      </svg>
      <strong className={cn('absolute inset-0 grid place-items-center font-mono tabular-nums text-card-foreground', compact ? 'text-body-small' : 'text-heading-2')}>{percentage}%</strong>
    </div>
  )
}
