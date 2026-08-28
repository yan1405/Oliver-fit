import { Outlet } from 'react-router-dom'
import { TabBar } from '../ui/TabBar'

export function AppShell() {
  return (
    <>
      <div className="pb-24"><Outlet /></div>
      <TabBar />
    </>
  )
}
