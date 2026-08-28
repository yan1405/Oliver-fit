import { Outlet } from 'react-router-dom'
import { TabBar } from '../ui/TabBar'

export function AppShell() {
  return (
    <>
      <div className="pb-16"><Outlet /></div>
      <TabBar />
    </>
  )
}
