import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useAutoLock } from '@/hooks/useAutoLock'
import { UnlockScreen } from '@/pages/UnlockScreen'
import { AppLayout } from '@/components/layout/app-layout'
import { Toaster } from '@/components/ui/toaster'
import Dashboard from '@/pages/Dashboard'
import SiteList from '@/pages/sites/SiteList'
import SiteDetail from '@/pages/sites/SiteDetail'
import DeviceList from '@/pages/devices/DeviceList'
import DeviceDetail from '@/pages/devices/DeviceDetail'
import CredentialList from '@/pages/credentials/CredentialList'
import DocumentList from '@/pages/documents/DocumentList'
import NoteList from '@/pages/notes/NoteList'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

function App() {
  const theme = useUiStore((s) => s.theme)
  const unlocked = useAuthStore((s) => s.unlocked)
  const loadAll = useDataStore((s) => s.loadAll)
  const [ready, setReady] = useState(false)

  useAutoLock()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (unlocked) {
      loadAll().then(() => setReady(true))
    }
  }, [unlocked, loadAll])

  if (!unlocked) {
    return (
      <>
        <UnlockScreen />
        <Toaster />
      </>
    )
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Lade Daten…
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sites" element={<SiteList />} />
          <Route path="/sites/:siteId" element={<SiteDetail />} />
          <Route path="/devices" element={<DeviceList />} />
          <Route path="/devices/:deviceId" element={<DeviceDetail />} />
          <Route path="/credentials" element={<CredentialList />} />
          <Route path="/documents" element={<DocumentList />} />
          <Route path="/notes" element={<NoteList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
