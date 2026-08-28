import { useEffect, useState } from 'react'
import { DailySummary } from '../components/features/DailySummary'
import { TrailPath, type TrailDay } from '../components/features/TrailPath'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { buildTrailWindow, resolveTrailState } from '../lib/trail'

export function HomePage() {
  const { session } = useAuth()
  const [days, setDays] = useState<TrailDay[]>([])
  const [streak, setStreak] = useState(0)
  const [workoutStatus, setWorkoutStatus] = useState<'in_progress' | 'completed' | 'skipped' | null>(null)
  const [calories, setCalories] = useState<number[]>([])
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    const userId = session.user.id

    async function load() {
      const windowDays = buildTrailWindow()
      const today = windowDays.find((day) => day.isToday)!
      const dates = windowDays.map((day) => day.date)
      const { error: writeError } = await supabase
        .from('trail_days')
        .upsert({ user_id: userId, trail_date: today.date }, { onConflict: 'user_id,trail_date' })

      if (writeError) throw writeError

      const [daysResult, streakResult, workoutResult, mealResult, profileResult] = await Promise.all([
        supabase
          .from('trail_days')
          .select('trail_date,day_completed')
          .gte('trail_date', dates.at(-1)!)
          .lte('trail_date', dates[0])
          .order('trail_date'),
        supabase
          .from('v_current_streak')
          .select('current_streak')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('workout_sessions')
          .select('status')
          .eq('session_date', today.date)
          .maybeSingle(),
        supabase
          .from('meals')
          .select('calories')
          .eq('meal_date', today.date),
        supabase
          .from('profiles')
          .select('daily_calorie_goal')
          .eq('id', userId)
          .single(),
      ])

      const loadError = daysResult.error ?? streakResult.error ?? workoutResult.error ?? mealResult.error ?? profileResult.error
      if (loadError || !daysResult.data || !mealResult.data || !profileResult.data) throw loadError ?? new Error('Dados do resumo ausentes.')

      const completed = new Map(daysResult.data.map((day) => [day.trail_date, day.day_completed]))
      const hydrated = windowDays.map<TrailDay>((day) => ({
        ...day,
        state: resolveTrailState(day.isToday, completed.get(day.date)),
      }))

      if (!cancelled) {
        setDays(hydrated)
        setStreak(streakResult.data?.current_streak ?? 0)
        setWorkoutStatus(workoutResult.data?.status ?? null)
        setCalories(mealResult.data.map((meal) => meal.calories))
        setCalorieGoal(profileResult.data.daily_calorie_goal)
        setError('')
      }
    }

    load().catch(() => !cancelled && setError('Não foi possível carregar sua trilha. Tente novamente.'))
    return () => { cancelled = true }
  }, [session, reload])

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto w-full max-w-app">
        <Card variant="glass">
          <p className="mb-2 text-overline font-semibold uppercase text-foreground">Seu ritmo</p>
          <h1 className="font-display text-heading-1 font-bold">Sua trilha</h1>
          {/* TODO(copy): revisar com o usuário antes da entrega final. */}
          <p className="mt-5 text-body text-foreground">Treino e dieta completos fecham o dia.</p>
        </Card>

        {days.length > 0 && <DailySummary workoutStatus={workoutStatus} calories={calories} calorieGoal={calorieGoal} streak={streak} />}

        {error ? (
          <Card className="mt-8">
            <p className="border-l-2 border-error pl-3 text-body text-card-foreground" role="alert">{error}</p>
            <Button className="mt-6 w-full" variant="secondary" type="button" onClick={() => setReload((value) => value + 1)}>Tentar novamente</Button>
          </Card>
        ) : days.length ? (
          <div className="mt-6">
            <TrailPath days={days} />
          </div>
        ) : (
          <p className="py-16 text-center text-body text-muted-foreground" role="status">Carregando trilha…</p>
        )}
      </div>
    </main>
  )
}
