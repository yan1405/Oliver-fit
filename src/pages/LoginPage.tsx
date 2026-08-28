import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
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
      <Card className="w-full max-w-app">
        <div className="mb-6 h-1 w-10 rounded-pill bg-primary" aria-hidden="true" />
        <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Oliver Fit</p>
        <h1 className="font-display text-heading-1 font-bold text-card-foreground">Entrar no aplicativo</h1>
        {/* TODO(copy): revisar com o usuário antes da entrega final. */}
        <p className="mt-3 text-body text-muted-foreground">
          Use sua conta Google pessoal para acessar seus treinos e registros.
        </p>

        <Button
          className="mt-8 w-full"
          type="button"
          onClick={signIn}
          disabled={loading}
        >
          {loading ? 'Abrindo Google…' : 'Continuar com Google'}
        </Button>

        {error && <p className="mt-4 border-l-2 border-error pl-3 text-body-small text-card-foreground" role="alert">{error}</p>}
      </Card>
    </main>
  )
}
