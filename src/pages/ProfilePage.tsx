import { useEffect, useState, type FormEvent } from 'react'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { List, ListItem } from '../components/ui/List'
import { useAuth } from '../hooks/useAuth'
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
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [editingGoals, setEditingGoals] = useState(false)
  const [goals, setGoals] = useState(emptyGoals)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    supabase.from('profiles').select('daily_calorie_goal,daily_protein_goal_g,daily_carb_goal_g,daily_fat_goal_g').eq('id', session.user.id).single().then(({ data, error: loadError }) => {
      if (loadError) return setError('Não foi possível carregar suas metas.')
      setGoals(Object.fromEntries(goalFields.map(([name]) => [name, String(data[name] ?? '')])) as Record<GoalName, string>)
    })
  }, [session])

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
