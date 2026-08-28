import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ActivityRing } from '../components/features/ActivityRing'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { decimalToHundredths, formatHundredths, macroProgress, nutritionTotals } from '../lib/nutrition'
import { supabase } from '../lib/supabase'
import { localDateKey } from '../lib/trail'
import type { Database } from '../types/database'

type Meal = Database['public']['Tables']['meals']['Row']
type MealType = Meal['meal_type']
type ProfileGoals = Pick<Database['public']['Tables']['profiles']['Row'], 'daily_calorie_goal' | 'daily_protein_goal_g' | 'daily_carb_goal_g' | 'daily_fat_goal_g'>
type NutritionStatus = Database['public']['Views']['v_daily_nutrition_status']['Row']

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Café da manhã' },
  { value: 'lunch', label: 'Almoço' },
  { value: 'dinner', label: 'Jantar' },
  { value: 'snack', label: 'Lanche' },
]
const emptyMeal = { id: '', meal_type: 'breakfast' as MealType, name: '', quantity: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' }

export function DietPage() {
  const { session } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [goals, setGoals] = useState<ProfileGoals | null>(null)
  const [nutritionStatus, setNutritionStatus] = useState<NutritionStatus | null>(null)
  const [mealForm, setMealForm] = useState(emptyMeal)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const today = localDateKey(new Date())

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    const [mealResult, profileResult, statusResult] = await Promise.all([
      supabase.from('meals').select('*').eq('meal_date', today).order('logged_at'),
      supabase.from('profiles').select('daily_calorie_goal,daily_protein_goal_g,daily_carb_goal_g,daily_fat_goal_g').eq('id', session.user.id).single(),
      supabase.from('v_daily_nutrition_status').select('*').eq('user_id', session.user.id).eq('meal_date', today).maybeSingle(),
    ])
    const firstError = mealResult.error ?? profileResult.error ?? statusResult.error
    if (firstError) {
      setError('Não foi possível carregar sua alimentação de hoje.')
      setLoading(false)
      return
    }

    const completed = Boolean(statusResult.data?.diet_completed)
    const { error: trailError } = await supabase.from('trail_days').upsert({
      user_id: session.user.id,
      trail_date: today,
      diet_completed: completed,
    }, { onConflict: 'user_id,trail_date' })
    if (trailError) setError('Os dados foram carregados, mas a trilha não pôde ser sincronizada.')
    setMeals(mealResult.data ?? [])
    setGoals(profileResult.data)
    setNutritionStatus(statusResult.data)
    setLoading(false)
  }, [session, today])

  useEffect(() => { void loadData() }, [loadData])

  const totals = nutritionTotals(meals)
  const calorieGoal = goals?.daily_calorie_goal ?? 0
  const calorieDifference = calorieGoal - totals.calories
  const macros = [
    { label: 'Proteína', value: totals.protein, goal: goals?.daily_protein_goal_g ?? null },
    { label: 'Carbo', value: totals.carbs, goal: goals?.daily_carb_goal_g ?? null },
    { label: 'Gordura', value: totals.fat, goal: goals?.daily_fat_goal_g ?? null },
  ]

  function openMeal(meal?: Meal, type: MealType = 'breakfast') {
    setMealForm(meal ? {
      id: meal.id,
      meal_type: meal.meal_type,
      name: meal.name,
      quantity: meal.quantity ?? '',
      calories: String(meal.calories),
      protein_g: String(meal.protein_g),
      carbs_g: String(meal.carbs_g),
      fat_g: String(meal.fat_g),
    } : { ...emptyMeal, meal_type: type })
    setSheetOpen(true)
  }

  async function saveMeal(event: FormEvent) {
    event.preventDefault()
    if (!session || !mealForm.name.trim()) return
    setSaving(true)
    setError('')
    const values = {
      user_id: session.user.id,
      meal_date: today,
      meal_type: mealForm.meal_type,
      name: mealForm.name.trim(),
      quantity: mealForm.quantity.trim() || null,
      calories: Number(mealForm.calories),
      protein_g: Number(mealForm.protein_g),
      carbs_g: Number(mealForm.carbs_g),
      fat_g: Number(mealForm.fat_g),
    }
    const result = mealForm.id
      ? await supabase.from('meals').update(values).eq('id', mealForm.id)
      : await supabase.from('meals').insert(values)
    setSaving(false)
    if (result.error) return setError('Não foi possível salvar a refeição.')
    setSheetOpen(false)
    await loadData()
  }

  async function deleteMeal() {
    if (!mealForm.id || !window.confirm('Excluir esta refeição?')) return
    setSaving(true)
    const { error: deleteError } = await supabase.from('meals').delete().eq('id', mealForm.id)
    setSaving(false)
    if (deleteError) return setError('Não foi possível excluir a refeição.')
    setSheetOpen(false)
    await loadData()
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto w-full max-w-app">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Hoje</p>
            <h1 className="font-display text-heading-1 font-bold">Sua dieta</h1>
          </div>
          <Button className="px-4" onClick={() => openMeal()}>Registrar</Button>
        </header>

        {error && <p className="mt-5 border-l-2 border-error pl-3 text-body-small" role="alert">{error}</p>}
        {loading ? <p className="py-16 text-center text-body text-muted-foreground">Carregando alimentação…</p> : (
          <>
            <Card className="mt-6" variant="glass">
              <div className="flex items-end justify-between gap-4 text-foreground">
                <div>
                  <p className="text-overline font-semibold uppercase">Calorias</p>
                  <strong className="mt-2 block font-mono text-display font-bold tabular-nums">{totals.calories}</strong>
                  <p className="mt-1 text-body-small">de {calorieGoal || '—'} kcal</p>
                </div>
                <p className="max-w-32 text-right text-body-small font-semibold">
                  {calorieGoal ? (calorieDifference >= 0 ? `${calorieDifference} kcal restantes` : `${Math.abs(calorieDifference)} kcal acima`) : 'Defina sua meta no Perfil'}
                </p>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {macros.map((macro) => (
                  <div key={macro.label} className="grid justify-items-center gap-2 text-center">
                    <ActivityRing compact progress={macroProgress(macro.value, macro.goal)} label={macro.label} />
                    <div>
                      <p className="text-caption font-semibold text-foreground">{macro.label}</p>
                      <p className="font-mono text-caption tabular-nums text-foreground">{formatHundredths(macro.value)} / {macro.goal === null ? '—' : formatHundredths(decimalToHundredths(macro.goal))} g</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-medium bg-card p-4 shadow-low">
              <div>
                <p className="text-body font-semibold text-card-foreground">Regra da trilha</p>
                <p className="mt-1 text-body-small text-muted-foreground">{nutritionStatus?.meals_logged ?? 0}/3 tipos de refeição · meta de 90–110%</p>
              </div>
              <span className={`rounded-pill px-3 py-2 text-body-small font-semibold ${nutritionStatus?.diet_completed ? 'bg-card text-card-foreground ring-2 ring-success' : 'bg-muted text-card-foreground'}`}>{nutritionStatus?.diet_completed ? 'Concluída' : 'Em andamento'}</span>
            </div>

            {!calorieGoal && <p className="mt-5 text-center text-body-small text-muted-foreground"><Link className="font-semibold text-foreground underline" to="/perfil">Configurar metas nutricionais</Link></p>}

            <div className="mt-8 grid gap-6">
              {mealTypes.map((type) => {
                const typeMeals = meals.filter((meal) => meal.meal_type === type.value)
                const typeCalories = typeMeals.reduce((total, meal) => total + meal.calories, 0)
                return (
                  <section key={type.value} aria-labelledby={`meal-${type.value}`}>
                    <div className="mb-3 flex items-center justify-between gap-4 px-1">
                      <div>
                        <h2 className="text-heading-3 font-semibold" id={`meal-${type.value}`}>{type.label}</h2>
                        <p className="text-caption text-muted-foreground">{typeCalories} kcal</p>
                      </div>
                      <button className="min-h-10 rounded-small bg-muted px-4 text-heading-3 font-semibold text-card-foreground" type="button" onClick={() => openMeal(undefined, type.value)}>Adicionar</button>
                    </div>
                    <div className="grid gap-3">
                      {typeMeals.map((meal) => (
                        <button key={meal.id} className="flex min-h-16 w-full items-center justify-between gap-4 rounded-large bg-card p-5 text-left shadow-low active:bg-muted" type="button" onClick={() => openMeal(meal)}>
                          <span>
                            <strong className="block text-body font-semibold text-card-foreground">{meal.name}</strong>
                            <span className="mt-1 block text-body-small text-muted-foreground">{meal.quantity || 'Quantidade não informada'}</span>
                          </span>
                          <strong className="shrink-0 font-mono text-body tabular-nums text-card-foreground">{meal.calories} kcal</strong>
                        </button>
                      ))}
                      {!typeMeals.length && <p className="rounded-large bg-card p-5 text-body-small text-muted-foreground shadow-low">Nenhum registro.</p>}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        )}
      </div>

      <BottomSheet open={sheetOpen} title={mealForm.id ? 'Editar refeição' : 'Registrar refeição'} onClose={() => setSheetOpen(false)}>
        <form className="grid gap-5" onSubmit={saveMeal}>
          <label className="grid gap-2 text-body-small font-semibold text-card-foreground">Tipo
            <select className="rounded-medium bg-muted px-4 py-4 text-body font-normal text-foreground outline-none focus:ring-2 focus:ring-primary" value={mealForm.meal_type} onChange={(event) => setMealForm((current) => ({ ...current, meal_type: event.target.value as MealType }))}>
              {mealTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <Input label="Nome" value={mealForm.name} onChange={(event) => setMealForm((current) => ({ ...current, name: event.target.value }))} required />
          <Input label="Quantidade" placeholder="Ex.: 150 g" value={mealForm.quantity} onChange={(event) => setMealForm((current) => ({ ...current, quantity: event.target.value }))} />
          <Input label="Calorias" suffix="kcal" type="number" min="0" step="1" inputMode="numeric" value={mealForm.calories} onChange={(event) => setMealForm((current) => ({ ...current, calories: event.target.value }))} required />
          <div className="grid grid-cols-3 gap-3">
            {([['protein_g', 'Proteína'], ['carbs_g', 'Carbo'], ['fat_g', 'Gordura']] as const).map(([field, label]) => <Input key={field} label={label} suffix="g" type="number" min="0" step="0.01" inputMode="decimal" value={mealForm[field]} onChange={(event) => setMealForm((current) => ({ ...current, [field]: event.target.value }))} required />)}
          </div>
          <Button disabled={saving} type="submit">Salvar refeição</Button>
          {mealForm.id && <Button disabled={saving} type="button" variant="ghost" onClick={deleteMeal}>Excluir refeição</Button>}
        </form>
      </BottomSheet>
    </main>
  )
}
