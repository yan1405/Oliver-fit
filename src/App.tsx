import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/features/AppShell'
import { AuthProvider } from './components/features/AuthProvider'
import { ProtectedRoute } from './components/features/ProtectedRoute'
import { Card } from './components/ui/Card'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'

const routes = [
  ['/treino', 'Treino'],
  ['/dieta', 'Dieta'],
  ['/progresso', 'Progresso'],
] as const

function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <Card className="w-full max-w-app">
        <div className="mb-4 h-1 w-10 rounded-pill bg-primary" aria-hidden="true" />
        <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Oliver Fit</p>
        <h1 className="text-heading-1 font-bold tracking-heading text-card-foreground">{title}</h1>
        {/* TODO(copy): revisar com o usuário antes da entrega final. */}
        <p className="mt-3 text-body text-muted-foreground">A base técnica está pronta para receber este módulo.</p>
      </Card>
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
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          {routes.map(([path, title]) => (
            <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
          ))}
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
    </Routes>
  )
}

function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}

export default App
