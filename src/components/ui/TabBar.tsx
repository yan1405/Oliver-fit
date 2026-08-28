import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'

const items = [
  ['/', 'Home', 'home'],
  ['/treino', 'Treino', 'workout'],
  ['/dieta', 'Dieta', 'nutrition'],
  ['/progresso', 'Progresso', 'progress'],
  ['/perfil', 'Perfil', 'profile'],
] as const

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-app border-t border-glass-border bg-glass px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-high backdrop-blur-[20px]" aria-label="Navegação principal">
      <ul className="grid grid-cols-5">
        {items.map(([to, label, icon]) => (
          <li key={to}>
            <NavLink
              className={({ isActive }) => cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-small text-caption font-semibold text-foreground transition-colors duration-200',
                !isActive && 'active:bg-muted',
              )}
              end={to === '/'}
              to={to}
            >
              {({ isActive }) => (
                <>
                  <TabIcon active={isActive} name={icon} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function TabIcon({ name, active }: { name: (typeof items)[number][2]; active: boolean }) {
  const common = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  return (
    <svg aria-hidden="true" className={cn('size-6', active && 'text-primary')} viewBox="0 0 24 24" fill="none">
      {name === 'home' && <><path d="M3.5 10.5 12 3l8.5 7.5" {...common} /><path d="M5.5 9v11h13V9M9.5 20v-6h5v6" {...common} /></>}
      {name === 'workout' && <><path d="M6 8v8M3.5 9.5v5M18 8v8M20.5 9.5v5M6 12h12" {...common} /></>}
      {name === 'nutrition' && <><path d="M7 3v7M4.5 3v4.5A2.5 2.5 0 0 0 7 10v11M9.5 3v4.5A2.5 2.5 0 0 1 7 10M17 3v18M17 3c2.2 1.8 3 4.2 3 7h-3" {...common} /></>}
      {name === 'progress' && <><path d="M4 19V5M4 19h16" {...common} /><path d="m7 15 4-4 3 2 5-6" {...common} /></>}
      {name === 'profile' && <><circle cx="12" cy="8" r="4" {...common} /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" {...common} /></>}
    </svg>
  )
}
