import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    })

    if (authError) {
      setError('Não foi possível iniciar o login. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-app rounded-large bg-card p-6 shadow-medium">
        <div className="mb-6 h-1 w-10 rounded-pill bg-primary" aria-hidden="true" />
        <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Oliver Fit</p>
        <h1 className="font-display text-heading-1 font-bold text-card-foreground">Entrar no aplicativo</h1>
        {/* TODO(copy): revisar com o usuário antes da entrega final. */}
        <p className="mt-3 text-body text-muted-foreground">
          Use sua conta Google pessoal para acessar seus treinos e registros.
        </p>

        <button
          className="mt-8 w-full rounded-medium bg-primary px-4 py-4 text-body font-semibold text-primary-foreground disabled:opacity-50"
          type="button"
          onClick={signIn}
          disabled={loading}
        >
          {loading ? 'Abrindo Google…' : 'Continuar com Google'}
        </button>

        {error && <p className="mt-4 text-body-small text-error" role="alert">{error}</p>}
      </section>
    </main>
  )
}
