import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const fields = [
  ['height_cm', 'Altura', 'cm', '170'],
  ['initial_weight_kg', 'Peso atual', 'kg', '70'],
  ['goal_weight_kg', 'Meta de peso', 'kg', '75'],
  ['daily_calorie_goal', 'Meta diária', 'kcal', '2200'],
  ['daily_protein_goal_g', 'Proteína', 'g', '160'],
  ['daily_carb_goal_g', 'Carboidrato', 'g', '250'],
  ['daily_fat_goal_g', 'Gordura', 'g', '70'],
] as const

type FieldName = (typeof fields)[number][0]

const emptyValues = Object.fromEntries(fields.map(([name]) => [name, ''])) as Record<FieldName, string>
const profileColumns = 'height_cm,initial_weight_kg,goal_weight_kg,daily_calorie_goal,daily_protein_goal_g,daily_carb_goal_g,daily_fat_goal_g'

export function OnboardingPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(emptyValues)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return

    supabase
      .from('profiles')
      .select(profileColumns)
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (loadError) {
          setError('Não foi possível carregar seus dados. Confira a conexão e tente novamente.')
        } else if (data) {
          setValues(Object.fromEntries(fields.map(([name]) => [name, String(data[name] ?? '')])) as Record<FieldName, string>)
        }
        setLoadingProfile(false)
      })
  }, [session])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return

    setSaving(true)
    setError('')
    const value = (name: FieldName) => Number(values[name])

    const { error: saveError } = await supabase.from('profiles').upsert({
      id: session.user.id,
      display_name: session.user.user_metadata.full_name ?? session.user.email ?? null,
      height_cm: value('height_cm'),
      initial_weight_kg: value('initial_weight_kg'),
      goal_weight_kg: value('goal_weight_kg'),
      daily_calorie_goal: value('daily_calorie_goal'),
      daily_protein_goal_g: value('daily_protein_goal_g'),
      daily_carb_goal_g: value('daily_carb_goal_g'),
      daily_fat_goal_g: value('daily_fat_goal_g'),
      updated_at: new Date().toISOString(),
    })

    if (saveError) {
      setError('Não foi possível salvar seus dados. Confira a conexão e tente novamente.')
      setSaving(false)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <form className="mx-auto w-full max-w-app rounded-large bg-card p-6 shadow-medium" onSubmit={submit}>
        <div className="mb-6 h-1 w-10 rounded-pill bg-primary" aria-hidden="true" />
        <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Configuração inicial</p>
        <h1 className="font-display text-heading-1 font-bold text-card-foreground">Suas metas</h1>
        {/* TODO(copy): revisar com o usuário antes da entrega final. */}
        <p className="mt-3 text-body text-muted-foreground">Defina os números que vão orientar seus registros diários.</p>

        <div className="mt-8 grid gap-5">
          {fields.map(([name, label, unit, placeholder]) => (
            <label className="grid gap-2 text-body-small font-semibold text-card-foreground" key={name}>
              {label}
              <span className="flex items-center rounded-medium bg-muted px-4">
                <input
                  className="min-w-0 flex-1 bg-transparent py-4 text-body font-normal text-foreground"
                  name={name}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step={name === 'daily_calorie_goal' ? '1' : '0.01'}
                  placeholder={placeholder}
                  value={values[name]}
                  onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                  required
                />
                <span className="text-body-small font-normal text-muted-foreground">{unit}</span>
              </span>
            </label>
          ))}
        </div>

        <button
          className="mt-8 w-full rounded-medium bg-primary px-4 py-4 text-body font-semibold text-primary-foreground disabled:opacity-50"
          type="submit"
          disabled={saving || loadingProfile}
        >
          {loadingProfile ? 'Carregando…' : saving ? 'Salvando…' : 'Salvar e continuar'}
        </button>
        {error && <p className="mt-4 text-body-small text-error" role="alert">{error}</p>}
      </form>
    </main>
  )
}
