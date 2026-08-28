import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/features/AuthProvider'
import { ProtectedRoute } from './components/features/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'

const routes = [
  ['/', 'Fundação do aplicativo'],
  ['/treino', 'Treino'],
  ['/dieta', 'Dieta'],
  ['/progresso', 'Progresso'],
  ['/perfil', 'Perfil'],
] as const

function PlaceholderPage({ title, showSignOut = false }: { title: string; showSignOut?: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-app rounded-large bg-card p-6 shadow-medium">
        <div className="mb-4 h-1 w-10 rounded-pill bg-primary" aria-hidden="true" />
        <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Oliver Fit</p>
        <h1 className="text-heading-1 font-bold tracking-heading text-card-foreground">{title}</h1>
        {/* TODO(copy): revisar com o usuário antes da entrega final. */}
        <p className="mt-3 text-body text-muted-foreground">A base técnica está pronta para receber este módulo.</p>
        {showSignOut && (
          <button className="mt-8 text-body font-semibold text-primary" type="button" onClick={() => supabase.auth.signOut()}>
            Sair da conta
          </button>
        )}
      </section>
    </main>
  )
}

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-body text-muted-foreground">Carregando…</main>
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        {routes.map(([path, title]) => (
          <Route key={path} path={path} element={<PlaceholderPage title={title} showSignOut={path === '/perfil'} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
    </Routes>
  )
}

function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}

export default App
