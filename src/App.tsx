import { Navigate, Route, Routes } from 'react-router-dom'

const routes = [
  ['/', 'Fundação do aplicativo'],
  ['/treino', 'Treino'],
  ['/dieta', 'Dieta'],
  ['/progresso', 'Progresso'],
  ['/perfil', 'Perfil'],
] as const

function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-app rounded-large bg-card p-6 shadow-medium">
        <div className="mb-4 h-1 w-10 rounded-pill bg-primary" aria-hidden="true" />
        <p className="mb-2 text-overline font-semibold uppercase text-muted-foreground">Oliver Fit</p>
        <h1 className="text-heading-1 font-bold tracking-heading text-card-foreground">
          {title}
        </h1>
        {/* TODO(copy): revisar com o usuário antes da entrega final. */}
        <p className="mt-3 text-body text-muted-foreground">
          A base técnica está pronta para receber os módulos do aplicativo.
        </p>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      {routes.map(([path, title]) => (
        <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
