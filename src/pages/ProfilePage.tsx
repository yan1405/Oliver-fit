import { useEffect, useState, type FormEvent } from 'react'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { List, ListItem } from '../components/ui/List'
import { useAuth } from '../hooks/useAuth'
import { usePush } from '../hooks/usePush'
import { isValidReminderTime, sortReminderTimes } from '../lib/push'
import { supabase } from '../lib/supabase'
import { localDateKey } from '../lib/trail'

const goalFields = [
  ['daily_calorie_goal', 'Calorias', 'kcal', '1'],
  ['daily_protein_goal_g', 'Proteína', 'g', '0.01'],
  ['daily_carb_goal_g', 'Carboidrato', 'g', '0.01'],
  ['daily_fat_goal_g', 'Gordura', 'g', '0.01'],
] as const
type GoalName = (typeof goalFields)[number][0]
const emptyGoals = Object.fromEntries(goalFields.map(([name]) => [name, ''])) as Record<GoalName, string>

export function ProfilePage() {
  const { session } = useAuth()
  const push = usePush()
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [editingGoals, setEditingGoals] = useState(false)
  const [goals, setGoals] = useState(emptyGoals)
  const [reminderTimes, setReminderTimes] = useState<string[]>([])
  const [newReminderTime, setNewReminderTime] = useState('08:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    supabase.from('profiles').select('daily_calorie_goal,daily_protein_goal_g,daily_carb_goal_g,daily_fat_goal_g,reminder_times').eq('id', session.user.id).single().then(({ data, error: loadError }) => {
      if (loadError) return setError('Não foi possível carregar suas metas.')
      setGoals(Object.fromEntries(goalFields.map(([name]) => [name, String(data[name] ?? '')])) as Record<GoalName, string>)
      setReminderTimes(data.reminder_times ?? [])
    })
  }, [session])

  async function saveReminderTimes(times: string[]) {
    if (!session) return
    const sorted = sortReminderTimes(times)
    setReminderTimes(sorted)
    const { error: saveError } = await supabase.from('profiles').update({ reminder_times: sorted, updated_at: new Date().toISOString() }).eq('id', session.user.id)
    if (saveError) setError('Não foi possível salvar os horários de lembrete.')
  }

  function addReminderTime() {
    if (!isValidReminderTime(newReminderTime) || reminderTimes.includes(newReminderTime)) return
    void saveReminderTimes([...reminderTimes, newReminderTime])
  }

  function removeReminderTime(time: string) {
    void saveReminderTimes(reminderTimes.filter((value) => value !== time))
  }

  async function saveGoals(event: FormEvent) {
    event.preventDefault()
    if (!session) return
    setSaving(true)
    const { error: saveError } = await supabase.from('profiles').update({
      daily_calorie_goal: Number(goals.daily_calorie_goal),
      daily_protein_goal_g: Number(goals.daily_protein_goal_g),
      daily_carb_goal_g: Number(goals.daily_carb_goal_g),
      daily_fat_goal_g: Number(goals.daily_fat_goal_g),
      updated_at: new Date().toISOString(),
    }).eq('id', session.user.id)
    if (saveError) {
      setSaving(false)
      return setError('Não foi possível salvar suas metas.')
    }
    const today = localDateKey(new Date())
    const { data: status, error: statusError } = await supabase.from('v_daily_nutrition_status').select('diet_completed').eq('user_id', session.user.id).eq('meal_date', today).maybeSingle()
    const { error: trailError } = await supabase.from('trail_days').upsert({ user_id: session.user.id, trail_date: today, diet_completed: Boolean(status?.diet_completed) }, { onConflict: 'user_id,trail_date' })
    setSaving(false)
    if (statusError || trailError) return setError('As metas foram salvas, mas a trilha não pôde ser sincronizada.')
    setError('')
    setEditingGoals(false)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto w-full max-w-app">
        <Card>
          <div className="mb-4 h-1 w-10 rounded-pill bg-primary" aria-hidden="true" />
          <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Oliver Fit</p>
          <h1 className="font-display text-heading-1 font-bold">Perfil</h1>
        </Card>

        {error && <p className="mt-5 border-l-2 border-error pl-3 text-body-small" role="alert">{error}</p>}

        <h2 className="mb-2 mt-8 px-4 text-overline font-semibold uppercase text-muted-foreground">Nutrição</h2>
        <List>
          <ListItem label="Metas diárias" detail={goals.daily_calorie_goal ? `${goals.daily_calorie_goal} kcal · ${goals.daily_protein_goal_g || '—'} g de proteína` : 'Defina calorias e macronutrientes'} onClick={() => setEditingGoals(true)} />
        </List>

        <h2 className="mb-2 mt-8 px-4 text-overline font-semibold uppercase text-muted-foreground">Notificações</h2>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body font-semibold text-card-foreground">Lembretes push</p>
              <p className="mt-1 text-body-small text-muted-foreground">
                {!push.isSupported ? 'Não suportado neste navegador' : push.subscribed ? 'Ativados neste dispositivo' : 'Desativados'}
              </p>
            </div>
            {push.isSupported && (
              <Button className="px-4" disabled={push.busy} variant={push.subscribed ? 'secondary' : 'primary'} onClick={() => void (push.subscribed ? push.unsubscribe() : push.subscribe())}>
                {push.subscribed ? 'Desativar' : 'Ativar'}
              </Button>
            )}
          </div>

          {push.error && <p className="mt-4 border-l-2 border-error pl-3 text-body-small text-card-foreground" role="alert">{push.error}</p>}

          <p className="mt-4 rounded-medium bg-muted p-4 text-caption text-muted-foreground">
            No iPhone, notificações só funcionam depois de adicionar o Oliver Fit à Tela de Início
            (compartilhar → Adicionar à Tela de Início) e com iOS 16.4 ou mais recente.
          </p>

          <div className="mt-5">
            <p className="text-body-small font-semibold text-card-foreground">Horários do lembrete diário</p>
            <p className="mt-1 text-caption text-muted-foreground">Avisa sobre treino e dieta pendentes do dia, nos horários que você definir.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reminderTimes.map((time) => (
                <span key={time} className="flex items-center gap-1 rounded-pill bg-muted py-2 pl-4 pr-2 text-body-small font-semibold text-card-foreground">
                  {time}
                  <button className="grid size-9 place-items-center rounded-pill text-heading-3 text-card-foreground active:bg-card" type="button" aria-label={`Remover horário ${time}`} onClick={() => removeReminderTime(time)}>×</button>
                </span>
              ))}
              {!reminderTimes.length && <span className="text-body-small text-muted-foreground">Nenhum horário definido</span>}
            </div>
            <div className="mt-4 flex items-end gap-3">
              <label className="grid gap-2 text-body-small font-semibold text-card-foreground" htmlFor="new-reminder-time">
                Novo horário
                <input className="rounded-medium bg-muted px-4 py-3 text-body text-foreground outline-none focus:ring-2 focus:ring-primary" id="new-reminder-time" type="time" value={newReminderTime} onChange={(event) => setNewReminderTime(event.target.value)} />
              </label>
              <Button className="px-4" type="button" variant="secondary" onClick={addReminderTime}>Adicionar</Button>
            </div>
          </div>

          <Button className="mt-5 w-full" type="button" variant="ghost" disabled={push.permission !== 'granted'} onClick={push.sendTestNotification}>Enviar notificação de teste</Button>
        </Card>

        <h2 className="mb-2 mt-8 px-4 text-overline font-semibold uppercase text-muted-foreground">Conta</h2>
        <List>
          <ListItem label="Sair da conta" detail="Encerra a sessão neste dispositivo" onClick={() => setConfirmingSignOut(true)} />
        </List>
      </div>

      <BottomSheet open={confirmingSignOut} title="Sair da conta?" onClose={() => setConfirmingSignOut(false)}>
        <p className="text-body text-muted-foreground">Seus registros continuarão salvos.</p>
        <div className="mt-6 grid gap-3">
          <Button type="button" onClick={() => supabase.auth.signOut()}>Sair</Button>
          <Button type="button" variant="secondary" onClick={() => setConfirmingSignOut(false)}>Cancelar</Button>
        </div>
      </BottomSheet>

      <BottomSheet open={editingGoals} title="Metas nutricionais" onClose={() => setEditingGoals(false)}>
        <form className="grid gap-5" onSubmit={saveGoals}>
          {goalFields.map(([name, label, suffix, step]) => <Input key={name} label={label} suffix={suffix} type="number" min="0" step={step} inputMode="decimal" value={goals[name]} onChange={(event) => setGoals((current) => ({ ...current, [name]: event.target.value }))} required />)}
          <Button disabled={saving} type="submit">Salvar metas</Button>
        </form>
      </BottomSheet>
    </main>
  )
}
