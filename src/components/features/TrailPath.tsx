import { cn } from '../../lib/cn'
import { serpentinePath, type TrailPoint, type TrailState } from '../../lib/trail'

export type TrailDay = TrailPoint & {
  state: TrailState
}

export function TrailPath({ days }: { days: TrailDay[] }) {
  const height = days.at(-1)?.y ? days.at(-1)!.y + 72 : 0

  return (
    <section className="relative mx-auto w-full max-w-[300px]" style={{ height }} aria-label="Trilha de progresso dos próximos dias">
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 300 ${height}`} fill="none" preserveAspectRatio="none">
        <path d={serpentinePath(days)} stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
        <path d={serpentinePath(days)} stroke="var(--muted)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 12" />
      </svg>

      <ol>
        {days.map((day) => (
          <li
            className="absolute flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center"
            key={day.date}
            style={{ left: day.x, top: day.y }}
          >
            <span
              className={cn(
                'relative flex size-16 items-center justify-center rounded-pill border-[3px] shadow-medium',
                day.state === 'completed' && 'border-primary bg-primary text-primary-foreground',
                day.state === 'today' && 'trail-node-today border-primary bg-card text-primary',
                day.state === 'locked' && 'border-border bg-muted text-muted-foreground',
              )}
              role="img"
              aria-label={`${day.isToday ? 'Hoje' : day.label}: ${stateLabel[day.state]}`}
            >
              {day.state === 'completed' ? <Check /> : day.isToday ? <TodayDot /> : <Lock />}
            </span>
            <span className="rounded-small bg-background/95 px-2 py-1 text-caption font-semibold text-foreground">
              {day.isToday ? 'Hoje' : day.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

const stateLabel = {
  locked: 'bloqueado',
  today: 'disponível',
  completed: 'concluído',
}

function Check() {
  return (
    <svg aria-hidden="true" className="size-8" viewBox="0 0 32 32" fill="none">
      <path d="m8 16 5 5 11-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Lock() {
  return (
    <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TodayDot() {
  return <span aria-hidden="true" className="size-3 rounded-pill bg-primary" />
}
