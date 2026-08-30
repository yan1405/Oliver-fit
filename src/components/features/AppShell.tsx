import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TabBar } from '../ui/TabBar'

export function AppShell() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <div className="pb-16"><Outlet /></div>
      <TabBar />
    </>
  )
}
