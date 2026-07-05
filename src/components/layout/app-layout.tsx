import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDataStore } from '@/store/useDataStore'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'

export function AppLayout() {
  const loadAll = useDataStore((s) => s.loadAll)
  const loaded = useDataStore((s) => s.loaded)

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {loaded ? (
            <Outlet />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Daten werden geladen…
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
