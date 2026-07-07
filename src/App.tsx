import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useAutoLock } from '@/hooks/useAutoLock'
import { AuthGate } from '@/pages/auth/AuthGate'
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
import UserManagement from '@/pages/UserManagement'
import AuditLog from '@/pages/AuditLog'
import Reports from '@/pages/Reports'
import NotFound from '@/pages/NotFound'

function App() {
  const theme = useUiStore((s) => s.theme)
  const booted = useAuthStore((s) => s.booted)
  const unlocked = useAuthStore((s) => s.unlocked)
  const boot = useAuthStore((s) => s.boot)
  const loadAll = useDataStore((s) => s.loadAll)
  const [ready, setReady] = useState(false)

  useAutoLock()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    boot()
  }, [boot])

  useEffect(() => {
    if (unlocked) {
      loadAll().then(() => setReady(true))
    } else {
      setReady(false)
    }
  }, [unlocked, loadAll])

  if (!booted) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Lade…
      </div>
    )
  }

  if (!unlocked) {
    return (
      <>
        <AuthGate />
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
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
