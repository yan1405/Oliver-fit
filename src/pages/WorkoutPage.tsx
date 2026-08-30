import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ActivityRing } from '../components/features/ActivityRing'
import { LoadChart } from '../components/features/LoadChart'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { List, ListItem } from '../components/ui/List'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { localDateKey } from '../lib/trail'
import { formatTimer, loadHistory, setProgress, weekdays } from '../lib/workouts'
import type { Database } from '../types/database'

type Row<Table extends keyof Database['public']['Tables']> = Database['public']['Tables'][Table]['Row']
type Exercise = Row<'exercises'>
type Plan = Row<'workout_plans'>
type PlanExercise = Row<'workout_plan_exercises'>
type Schedule = Row<'workout_schedule'>
type Session = Row<'workout_sessions'>
type SetLog = Row<'set_logs'>
type Tab = 'today' | 'plans' | 'exercises'
type Targets = { target_sets: string; target_reps: string; target_load_kg: string; rest_seconds: string }

const emptyExercise = { id: '', name: '', muscle_group: '', equipment: '', notes: '' }
const emptyPlan = { id: '', name: '', description: '', weekdays: [] as number[], items: {} as Record<string, Targets> }
const defaultTargets = (): Targets => ({ target_sets: '3', target_reps: '10', target_load_kg: '', rest_seconds: '90' })
const inputSurface = 'w-full rounded-medium bg-muted px-4 py-4 text-body text-foreground outline-none focus:ring-2 focus:ring-primary'

export function WorkoutPage() {
  const { session: authSession } = useAuth()
  const [tab, setTab] = useState<Tab>('today')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [planItems, setPlanItems] = useState<PlanExercise[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [logs, setLogs] = useState<SetLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [exerciseForm, setExerciseForm] = useState(emptyExercise)
  const [planForm, setPlanForm] = useState(emptyPlan)
  const [exerciseSheet, setExerciseSheet] = useState(false)
  const [planSheet, setPlanSheet] = useState(false)
  const [setValues, setSetValues] = useState<Record<string, { reps: string; load: string }>>({})
  const [remainingRest, setRemainingRest] = useState(0)
  const [historyExerciseId, setHistoryExerciseId] = useState('')

  const loadData = useCallback(async () => {
    if (!authSession) return
    setLoading(true)
    setError('')

    const [exerciseResult, planResult, itemResult, scheduleResult, sessionResult] = await Promise.all([
      supabase.from('exercises').select('*').order('name'),
      supabase.from('workout_plans').select('*').order('created_at'),
      supabase.from('workout_plan_exercises').select('*').order('order_index'),
      supabase.from('workout_schedule').select('*').order('weekday'),
      supabase.from('workout_sessions').select('*').order('session_date', { ascending: false }).limit(90),
    ])

    const firstError = exerciseResult.error ?? planResult.error ?? itemResult.error ?? scheduleResult.error ?? sessionResult.error
    if (firstError) {
      setError('Não foi possível carregar seus treinos. Tente novamente.')
      setLoading(false)
      return
    }

    const loadedSessions = sessionResult.data ?? []
    const logResult = loadedSessions.length
      ? await supabase.from('set_logs').select('*').in('session_id', loadedSessions.map((item) => item.id)).order('completed_at')
      : { data: [] as SetLog[], error: null }

    if (logResult.error) {
      setError('Não foi possível carregar o histórico de séries.')
    } else {
      setExercises(exerciseResult.data ?? [])
      setPlans(planResult.data ?? [])
      setPlanItems(itemResult.data ?? [])
      setSchedules(scheduleResult.data ?? [])
      setSessions(loadedSessions)
      setLogs(logResult.data ?? [])
      setHistoryExerciseId((current) => current || exerciseResult.data?.[0]?.id || '')
    }
    setLoading(false)
  }, [authSession])

  useEffect(() => { void loadData() }, [loadData])
  useEffect(() => {
    if (!remainingRest) return
    const timer = window.setInterval(() => setRemainingRest((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [remainingRest])

  const today = localDateKey(new Date())
  const todaySchedule = schedules.find((item) => item.weekday === new Date().getDay())
  const todayPlan = plans.find((plan) => plan.id === todaySchedule?.plan_id)
  const todayItems = planItems.filter((item) => item.plan_id === todayPlan?.id).sort((a, b) => a.order_index - b.order_index)
  const todaySession = sessions.find((item) => item.session_date === today)
  const todayLogs = logs.filter((log) => log.session_id === todaySession?.id)
  const targetSets = todayItems.reduce((total, item) => total + (item.target_sets ?? 0), 0)
  const progress = setProgress(todayLogs.length, targetSets)
  const history = useMemo(() => loadHistory(sessions, logs, historyExerciseId), [sessions, logs, historyExerciseId])

  function openExercise(exercise?: Exercise) {
    setExerciseForm(exercise ? {
      id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group ?? '',
      equipment: exercise.equipment ?? '',
      notes: exercise.notes ?? '',
    } : emptyExercise)
    setExerciseSheet(true)
  }

  async function saveExercise(event: FormEvent) {
    event.preventDefault()
    if (!authSession || !exerciseForm.name.trim()) return
    setSaving(true)
    const values = {
      user_id: authSession.user.id,
      name: exerciseForm.name.trim(),
      muscle_group: exerciseForm.muscle_group.trim() || null,
      equipment: exerciseForm.equipment.trim() || null,
      notes: exerciseForm.notes.trim() || null,
    }
    const result = exerciseForm.id
      ? await supabase.from('exercises').update(values).eq('id', exerciseForm.id)
      : await supabase.from('exercises').insert(values)
    setSaving(false)
    if (result.error) return setError('Não foi possível salvar o exercício.')
    setExerciseSheet(false)
    await loadData()
  }

  async function deleteExercise() {
    if (!exerciseForm.id || !window.confirm('Excluir este exercício?')) return
    setSaving(true)
    const { error: deleteError } = await supabase.from('exercises').delete().eq('id', exerciseForm.id)
    setSaving(false)
    if (deleteError) return setError('Este exercício está em um plano ou histórico e não pode ser excluído.')
    setExerciseSheet(false)
    await loadData()
  }

  function openPlan(plan?: Plan) {
    if (!plan) {
      setPlanForm(emptyPlan)
    } else {
      const items = Object.fromEntries(planItems.filter((item) => item.plan_id === plan.id).map((item) => [item.exercise_id, {
        target_sets: String(item.target_sets ?? 3),
        target_reps: String(item.target_reps ?? 10),
        target_load_kg: String(item.target_load_kg ?? ''),
        rest_seconds: String(item.rest_seconds ?? 90),
      }]))
      setPlanForm({
        id: plan.id,
        name: plan.name,
        description: plan.description ?? '',
        weekdays: schedules.filter((item) => item.plan_id === plan.id).map((item) => item.weekday),
        items,
      })
    }
    setPlanSheet(true)
  }

  function togglePlanExercise(exerciseId: string) {
    setPlanForm((current) => {
      const items = { ...current.items }
      if (items[exerciseId]) delete items[exerciseId]
      else items[exerciseId] = defaultTargets()
      return { ...current, items }
    })
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault()
    if (!authSession || !planForm.name.trim() || !planForm.weekdays.length || !Object.keys(planForm.items).length) {
      setError('Informe o nome, pelo menos um dia e um exercício para o plano.')
      return
    }
    setSaving(true)
    const planValues = { user_id: authSession.user.id, name: planForm.name.trim(), description: planForm.description.trim() || null }
    const planResult = planForm.id
      ? await supabase.from('workout_plans').update(planValues).eq('id', planForm.id).select().single()
      : await supabase.from('workout_plans').insert(planValues).select().single()

    if (planResult.error) {
      setSaving(false)
      return setError('Não foi possível salvar o plano.')
    }

    const planId = planResult.data.id
    const items = Object.entries(planForm.items).map(([exerciseId, targets], index) => ({
      plan_id: planId,
      exercise_id: exerciseId,
      order_index: index,
      target_sets: Number(targets.target_sets),
      target_reps: Number(targets.target_reps),
      target_load_kg: targets.target_load_kg ? Number(targets.target_load_kg) : null,
      rest_seconds: Number(targets.rest_seconds),
    }))
    const oldItemIds = planItems.filter((item) => item.plan_id === planId).map((item) => item.id)
    const obsoleteScheduleIds = schedules.filter((item) => item.plan_id === planId && !planForm.weekdays.includes(item.weekday)).map((item) => item.id)
    const itemResult = await supabase.from('workout_plan_exercises').insert(items).select('id')
    if (itemResult.error) {
      if (!planForm.id) await supabase.from('workout_plans').delete().eq('id', planId)
      setSaving(false)
      return setError('Não foi possível salvar os exercícios do plano. A versão anterior foi preservada.')
    }
    const scheduleResult = await supabase.from('workout_schedule').upsert(planForm.weekdays.map((weekday) => ({ user_id: authSession.user.id, plan_id: planId, weekday })), { onConflict: 'user_id,weekday' })
    if (scheduleResult.error) {
      await supabase.from('workout_plan_exercises').delete().in('id', itemResult.data.map((item) => item.id))
      if (!planForm.id) await supabase.from('workout_plans').delete().eq('id', planId)
      setSaving(false)
      return setError('Não foi possível salvar a agenda. A versão anterior foi preservada.')
    }
    await Promise.all([
      oldItemIds.length ? supabase.from('workout_plan_exercises').delete().in('id', oldItemIds) : Promise.resolve(),
      obsoleteScheduleIds.length ? supabase.from('workout_schedule').delete().in('id', obsoleteScheduleIds) : Promise.resolve(),
    ])
    setSaving(false)
    setPlanSheet(false)
    await loadData()
  }

  async function deletePlan() {
    if (!planForm.id || !window.confirm('Excluir este plano de treino?')) return
    setSaving(true)
    const { error: deleteError } = await supabase.from('workout_plans').delete().eq('id', planForm.id)
    setSaving(false)
    if (deleteError) return setError('Não foi possível excluir o plano.')
    setPlanSheet(false)
    await loadData()
  }

  async function startWorkout() {
    if (!authSession || !todayPlan) return
    setSaving(true)
    const { error: startError } = await supabase.from('workout_sessions').upsert({
      user_id: authSession.user.id,
      plan_id: todayPlan.id,
      session_date: today,
      started_at: new Date().toISOString(),
      status: 'in_progress',
    }, { onConflict: 'user_id,session_date' })
    setSaving(false)
    if (startError) return setError('Não foi possível iniciar o treino.')
    await loadData()
  }

  async function logSet(item: PlanExercise) {
    if (!todaySession) return
    const values = setValues[item.id] ?? { reps: '', load: '' }
    if (!values.reps || Number(values.reps) <= 0 || values.load === '' || Number(values.load) < 0) {
      setError('Informe repetições e carga válidas para registrar a série.')
      return
    }
    const setNumber = todayLogs.filter((log) => log.exercise_id === item.exercise_id).length + 1
    setSaving(true)
    const { error: logError } = await supabase.from('set_logs').insert({
      session_id: todaySession.id,
      exercise_id: item.exercise_id,
      set_number: setNumber,
      reps: Number(values.reps),
      load_kg: Number(values.load),
      rest_seconds: item.rest_seconds,
    })
    setSaving(false)
    if (logError) return setError('Não foi possível registrar a série.')
    setRemainingRest(item.rest_seconds ?? 90)
    setSetValues((current) => ({ ...current, [item.id]: { reps: '', load: values.load } }))
    await loadData()
  }

  async function completeWorkout() {
    if (!authSession || !todaySession || !window.confirm('Concluir o treino de hoje?')) return
    setSaving(true)
    const now = new Date().toISOString()
    const [sessionResult, trailResult] = await Promise.all([
      supabase.from('workout_sessions').update({ status: 'completed', completed_at: now }).eq('id', todaySession.id),
      supabase.from('trail_days').upsert({ user_id: authSession.user.id, trail_date: today, workout_completed: true }, { onConflict: 'user_id,trail_date' }),
    ])
    setSaving(false)
    if (sessionResult.error || trailResult.error) return setError('Não foi possível concluir o treino. Tente novamente.')
    await loadData()
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto w-full max-w-app">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Treinos</p>
            <h1 className="font-display text-heading-1 font-bold">Seu treino</h1>
          </div>
          {remainingRest > 0 && (
            <button className="rounded-pill bg-primary px-4 py-2 font-mono text-heading-3 font-bold tabular-nums text-primary-foreground shadow-medium" type="button" onClick={() => setRemainingRest(0)} aria-label="Encerrar descanso">
              {formatTimer(remainingRest)}
            </button>
          )}
        </header>

        <div className="mt-6 grid grid-cols-3 rounded-medium bg-muted p-1" role="tablist" aria-label="Seções de treino">
          {([['today', 'Hoje'], ['plans', 'Planos'], ['exercises', 'Exercícios']] as const).map(([value, label]) => (
            <button key={value} className={`min-h-10 rounded-small px-2 text-body-small font-semibold ${tab === value ? 'bg-card text-card-foreground shadow-low' : 'text-muted-foreground'}`} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</button>
          ))}
        </div>

        {error && <p className="mt-5 border-l-2 border-error pl-3 text-body-small" role="alert">{error}</p>}
        {loading ? <p className="py-16 text-center text-body text-muted-foreground">Carregando treinos…</p> : (
          <>
            {tab === 'today' && (
              <section className="mt-6" aria-labelledby="today-title">
                <Card variant="glass">
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-overline font-semibold uppercase text-foreground">{weekdays[new Date().getDay()]}</p>
                      <h2 className="mt-2 font-display text-heading-2 font-bold text-foreground" id="today-title">{todayPlan?.name ?? 'Dia livre'}</h2>
                      <p className="mt-2 text-body-small text-foreground">{todayPlan ? `${todayLogs.length} de ${targetSets} séries` : 'Nenhum plano agendado.'}</p>
                    </div>
                    <ActivityRing progress={progress} label="Progresso do treino" />
                  </div>
                </Card>

                {todayPlan && !todaySession && <Button className="mt-5 w-full" disabled={saving} onClick={startWorkout}>Iniciar treino</Button>}
                {todaySession?.status === 'completed' && <p className="mt-5 rounded-medium border-l-2 border-success bg-card p-4 text-center text-body font-semibold text-card-foreground shadow-low">Treino concluído</p>}
                {todaySession?.status === 'in_progress' && (
                  <div className="mt-6 grid gap-4">
                    {todayItems.map((item) => {
                      const exercise = exercises.find((candidate) => candidate.id === item.exercise_id)
                      const completedSets = todayLogs.filter((log) => log.exercise_id === item.exercise_id).length
                      const values = setValues[item.id] ?? { reps: '', load: String(item.target_load_kg ?? '') }
                      return (
                        <Card key={item.id}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-heading-3 font-semibold">{exercise?.name ?? 'Exercício'}</h3>
                              <p className="mt-1 text-body-small text-muted-foreground">{completedSets}/{item.target_sets ?? 0} séries · alvo {item.target_reps ?? '—'} reps</p>
                            </div>
                            <span className="rounded-pill bg-muted px-3 py-1 font-mono text-caption font-semibold text-card-foreground">{item.rest_seconds ?? 90}s</span>
                          </div>
                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <Input label="Repetições" type="number" min="1" step="1" inputMode="numeric" value={values.reps} onChange={(event) => setSetValues((current) => ({ ...current, [item.id]: { ...values, reps: event.target.value } }))} />
                            <Input label="Carga" suffix="kg" type="number" min="0" step="0.01" inputMode="decimal" value={values.load} onChange={(event) => setSetValues((current) => ({ ...current, [item.id]: { ...values, load: event.target.value } }))} />
                          </div>
                          <Button className="mt-4 w-full" variant="secondary" disabled={saving || completedSets >= (item.target_sets ?? 0)} onClick={() => logSet(item)}>Registrar série {completedSets + 1}</Button>
                        </Card>
                      )
                    })}
                    <Button className="w-full" disabled={saving || !todayLogs.length} onClick={completeWorkout}>Concluir treino</Button>
                  </div>
                )}

                <Card className="mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-overline font-semibold uppercase text-muted-foreground">Histórico</p>
                      <h2 className="mt-2 text-heading-3 font-semibold">Evolução de carga</h2>
                    </div>
                    <select className="max-w-40 rounded-small bg-muted px-3 py-2 text-body-small text-card-foreground" aria-label="Exercício do histórico" value={historyExerciseId} onChange={(event) => setHistoryExerciseId(event.target.value)}>
                      {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                    </select>
                  </div>
                  <div className="mt-5"><LoadChart points={history} /></div>
                </Card>
              </section>
            )}

            {tab === 'plans' && (
              <section className="mt-6" aria-labelledby="plans-title">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-heading-2 font-bold" id="plans-title">Planos</h2>
                  <Button className="px-4" onClick={() => openPlan()} disabled={!exercises.length}>Novo plano</Button>
                </div>
                {!exercises.length && <p className="mt-4 text-body-small text-muted-foreground">Cadastre um exercício antes de montar seu primeiro plano.</p>}
                <List className="mt-4">
                  {plans.map((plan) => {
                    const days = schedules.filter((item) => item.plan_id === plan.id).map((item) => weekdays[item.weekday]).join(', ')
                    const count = planItems.filter((item) => item.plan_id === plan.id).length
                    return <ListItem key={plan.id} label={plan.name} detail={`${days || 'Sem agenda'} · ${count} ${count === 1 ? 'exercício' : 'exercícios'}`} onClick={() => openPlan(plan)} />
                  })}
                </List>
                {!plans.length && <p className="py-12 text-center text-body text-muted-foreground">Nenhum plano criado.</p>}
              </section>
            )}

            {tab === 'exercises' && (
              <section className="mt-6" aria-labelledby="exercises-title">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-heading-2 font-bold" id="exercises-title">Exercícios</h2>
                  <Button className="px-4" onClick={() => openExercise()}>Novo exercício</Button>
                </div>
                <List className="mt-4">
                  {exercises.map((exercise) => <ListItem key={exercise.id} label={exercise.name} detail={[exercise.muscle_group, exercise.equipment].filter(Boolean).join(' · ') || 'Sem detalhes'} onClick={() => openExercise(exercise)} />)}
                </List>
                {!exercises.length && <p className="py-12 text-center text-body text-muted-foreground">Sua biblioteca está vazia.</p>}
              </section>
            )}
          </>
        )}
      </div>

      <BottomSheet open={exerciseSheet} title={exerciseForm.id ? 'Editar exercício' : 'Novo exercício'} onClose={() => setExerciseSheet(false)}>
        <form className="grid gap-5" onSubmit={saveExercise}>
          <Input label="Nome" value={exerciseForm.name} onChange={(event) => setExerciseForm((current) => ({ ...current, name: event.target.value }))} required />
          <Input label="Grupo muscular" value={exerciseForm.muscle_group} onChange={(event) => setExerciseForm((current) => ({ ...current, muscle_group: event.target.value }))} />
          <Input label="Equipamento" value={exerciseForm.equipment} onChange={(event) => setExerciseForm((current) => ({ ...current, equipment: event.target.value }))} />
          <label className="grid gap-2 text-body-small font-semibold">Observações<textarea className={inputSurface} rows={3} value={exerciseForm.notes} onChange={(event) => setExerciseForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          <Button disabled={saving} type="submit">Salvar exercício</Button>
          {exerciseForm.id && <Button disabled={saving} type="button" variant="ghost" onClick={deleteExercise}>Excluir exercício</Button>}
        </form>
      </BottomSheet>

      <BottomSheet open={planSheet} title={planForm.id ? 'Editar plano' : 'Novo plano'} onClose={() => setPlanSheet(false)}>
        <form className="grid gap-6" onSubmit={savePlan}>
          <Input label="Nome" value={planForm.name} onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))} required />
          <label className="grid gap-2 text-body-small font-semibold">Descrição<textarea className={inputSurface} rows={2} value={planForm.description} onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value }))} /></label>
          <fieldset>
            <legend className="text-body-small font-semibold">Dias da semana</legend>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {weekdays.map((day, index) => <label key={day} className={`grid min-h-12 place-items-center rounded-small text-body-small font-semibold ${planForm.weekdays.includes(index) ? 'bg-card text-card-foreground ring-2 ring-primary' : 'bg-muted text-card-foreground'}`}><input className="sr-only" type="checkbox" checked={planForm.weekdays.includes(index)} onChange={() => setPlanForm((current) => ({ ...current, weekdays: current.weekdays.includes(index) ? current.weekdays.filter((value) => value !== index) : [...current.weekdays, index] }))} />{day}</label>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-body-small font-semibold">Exercícios do plano</legend>
            <div className="mt-3 grid gap-3">
              {exercises.map((exercise) => {
                const targets = planForm.items[exercise.id]
                return <div key={exercise.id} className="rounded-medium bg-muted p-4">
                  <label className="flex min-h-8 items-center gap-3 text-body font-semibold"><input className="size-5 accent-primary" type="checkbox" checked={Boolean(targets)} onChange={() => togglePlanExercise(exercise.id)} />{exercise.name}</label>
                  {targets && <div className="mt-4 grid grid-cols-2 gap-3">
                    {([['target_sets', 'Séries', '1'], ['target_reps', 'Reps', '1'], ['target_load_kg', 'Carga kg', '0.01'], ['rest_seconds', 'Descanso s', '1']] as const).map(([field, label, step]) => <Input key={field} label={label} type="number" min={field === 'target_load_kg' || field === 'rest_seconds' ? '0' : '1'} step={step} value={targets[field]} onChange={(event) => setPlanForm((current) => ({ ...current, items: { ...current.items, [exercise.id]: { ...targets, [field]: event.target.value } } }))} required={field !== 'target_load_kg'} />)}
                  </div>}
                </div>
              })}
            </div>
          </fieldset>
          <Button disabled={saving} type="submit">Salvar plano</Button>
          {planForm.id && <Button disabled={saving} type="button" variant="ghost" onClick={deletePlan}>Excluir plano</Button>}
        </form>
      </BottomSheet>
    </main>
  )
}
