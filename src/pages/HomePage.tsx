import { useEffect, useState } from 'react'
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

      const [daysResult, streakResult] = await Promise.all([
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
      ])

      if (daysResult.error) throw daysResult.error
      if (streakResult.error) throw streakResult.error

      const completed = new Map(daysResult.data.map((day) => [day.trail_date, day.day_completed]))
      const hydrated = windowDays.map<TrailDay>((day) => ({
        ...day,
        state: resolveTrailState(day.isToday, completed.get(day.date)),
      }))

      if (!cancelled) {
        setDays(hydrated)
        setStreak(streakResult.data?.current_streak ?? 0)
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
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-overline font-semibold uppercase text-foreground">Seu ritmo</p>
              <h1 className="font-display text-heading-1 font-bold">Sua trilha</h1>
            </div>
            <div className="text-right" aria-label={`Sequência atual: ${streak} ${streak === 1 ? 'dia' : 'dias'}`}>
              <strong className="block font-mono text-display font-bold tabular-nums text-foreground">{streak}</strong>
              <span className="text-caption font-semibold text-foreground">{streak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
            </div>
          </div>
          {/* TODO(copy): revisar com o usuário antes da entrega final. */}
          <p className="mt-5 text-body text-foreground">Treino e dieta completos fecham o dia.</p>
        </Card>

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
