import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/features/AppShell'
import { AuthProvider } from './components/features/AuthProvider'
import { ProtectedRoute } from './components/features/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'

const WorkoutPage = lazy(() => import('./pages/WorkoutPage').then((module) => ({ default: module.WorkoutPage })))
const DietPage = lazy(() => import('./pages/DietPage').then((module) => ({ default: module.DietPage })))
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((module) => ({ default: module.ProgressPage })))

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
          <Route path="/treino" element={<Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background text-body text-muted-foreground">Carregando treino…</main>}><WorkoutPage /></Suspense>} />
          <Route path="/dieta" element={<Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background text-body text-muted-foreground">Carregando dieta…</main>}><DietPage /></Suspense>} />
          <Route path="/progresso" element={<Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background text-body text-muted-foreground">Carregando progresso…</main>}><ProgressPage /></Suspense>} />
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
