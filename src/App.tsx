import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { MasterPasswordGate } from '@/components/auth/master-password-gate'
import { AppLayout } from '@/components/layout/app-layout'
import { DashboardPage } from '@/pages/dashboard-page'
import { SitesPage } from '@/pages/sites-page'
import { SiteDetailPage } from '@/pages/site-detail-page'
import { DevicesPage } from '@/pages/devices-page'
import { DeviceDetailPage } from '@/pages/device-detail-page'
import { CredentialsPage } from '@/pages/credentials-page'
import { DocumentsPage } from '@/pages/documents-page'
import { NotesPage } from '@/pages/notes-page'
import { TicketsPage } from '@/pages/tickets-page'
import { TicketDetailPage } from '@/pages/ticket-detail-page'
import { SettingsPage } from '@/pages/settings-page'

function App() {
  return (
    <BrowserRouter>
      <MasterPasswordGate>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/sites/:siteId" element={<SiteDetailPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/devices/:deviceId" element={<DeviceDetailPage />} />
            <Route path="/credentials" element={<CredentialsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </MasterPasswordGate>
      <Toaster richColors position="bottom-right" />
    </BrowserRouter>
  )
}

export default App
