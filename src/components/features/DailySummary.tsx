import { calorieSummary, workoutStatusLabel } from '../../lib/dashboard'
import { Card } from '../ui/Card'

type Props = {
  workoutStatus: 'in_progress' | 'completed' | 'skipped' | null
  calories: number[]
  calorieGoal: number | null
  streak: number
}

export function DailySummary({ workoutStatus, calories, calorieGoal, streak }: Props) {
  const { consumed, remaining } = calorieSummary(calories, calorieGoal)
  const validCalorieGoal = calorieGoal !== null && calorieGoal > 0 ? calorieGoal : null
  const calorieProgress = validCalorieGoal ? Math.min(consumed / validCalorieGoal, 1) : 0
  const workoutLabel = workoutStatusLabel(workoutStatus)

  return (
    <section className="mt-8" aria-labelledby="daily-summary-title">
      <p className="px-1 text-overline font-semibold uppercase text-muted-foreground">Visão do dia</p>
      <h2 className="mt-2 px-1 font-display text-heading-2 font-bold" id="daily-summary-title">Resumo de hoje</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="col-span-2 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-body-small font-semibold text-muted-foreground">Calorias</p>
              <strong className="mt-2 block font-mono text-display font-bold tabular-nums text-card-foreground">{remaining === null ? '—' : Math.abs(remaining)}</strong>
              <p className="mt-1 text-body-small text-muted-foreground">{remaining === null ? 'Defina sua meta' : remaining >= 0 ? 'kcal restantes' : 'kcal acima da meta'}</p>
            </div>
            <p className="text-right font-mono text-body-small tabular-nums text-card-foreground">{consumed} / {validCalorieGoal ?? '—'}</p>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-pill bg-muted" role="progressbar" aria-label="Progresso de calorias" aria-valuemin={0} aria-valuemax={validCalorieGoal ?? undefined} aria-valuenow={validCalorieGoal ? Math.min(consumed, validCalorieGoal) : undefined}>
            <div className="h-full rounded-pill bg-primary transition-[width] duration-300" style={{ width: `${calorieProgress * 100}%` }} />
          </div>
        </Card>

        <Card className="p-5">
          <span className={`block size-3 rounded-pill ${workoutStatus === 'completed' ? 'bg-success' : 'bg-muted'}`} aria-hidden="true" />
          <p className="mt-5 text-body-small font-semibold text-muted-foreground">Treino</p>
          <strong className="mt-1 block text-heading-3 font-semibold text-card-foreground">{workoutLabel}</strong>
        </Card>

        <Card className="p-5">
          <strong className="block font-mono text-display font-bold tabular-nums text-card-foreground">{streak}</strong>
          <p className="mt-5 text-body-small font-semibold text-muted-foreground">{streak === 1 ? 'dia seguido' : 'dias seguidos'}</p>
        </Card>
      </div>
    </section>
  )
}
