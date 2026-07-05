import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ChevronRight,
  Building2,
  Server,
  KeyRound,
  FileText,
  NotebookText,
  Settings,
  Search,
  LayoutDashboard,
  Plus,
} from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import { SiteFormDialog } from '@/pages/sites/SiteFormDialog'

const quickLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/sites', label: 'Standorte', icon: Building2 },
  { to: '/devices', label: 'Geräte', icon: Server },
  { to: '/credentials', label: 'Zugangsdaten', icon: KeyRound },
  { to: '/documents', label: 'Dokumente', icon: FileText },
  { to: '/notes', label: 'Notizen', icon: NotebookText },
]

export function Sidebar() {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const rooms = useDataStore((s) => s.rooms)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [siteFormOpen, setSiteFormOpen] = useState(false)

  if (collapsed) return null

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          IT
        </div>
        <span className="text-sm font-semibold">IT-Doku</span>
      </div>

      <div className="p-3">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-background/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Suchen…</span>
          <kbd className="rounded border border-border bg-muted px-1 text-[10px]">⌘K</kbd>
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {quickLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent',
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-2 flex items-center justify-between px-4 pt-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Standorte
        </span>
        <button
          onClick={() => setSiteFormOpen(true)}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Standort anlegen"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 pt-1">
        {sites.length === 0 && (
          <p className="px-2.5 py-2 text-xs text-muted-foreground">Noch keine Standorte.</p>
        )}
        {sites
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((site) => {
            const isExpanded = expanded.has(site.id)
            const deviceCount = devices.filter((d) => d.siteId === site.id).length
            return (
              <div key={site.id}>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => toggleExpand(site.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent"
                  >
                    <ChevronRight
                      className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')}
                    />
                  </button>
                  <NavLink
                    to={`/sites/${site.id}`}
                    className={({ isActive }) =>
                      cn(
                        'flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-sm',
                        isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent',
                      )
                    }
                  >
                    <span className="truncate">{site.name}</span>
                    <span className="text-xs text-muted-foreground">{deviceCount}</span>
                  </NavLink>
                </div>
                {isExpanded && (
                  <div className="ml-6 border-l border-sidebar-border pl-2">
                    {rooms
                      .filter((r) => r.siteId === site.id)
                      .map((room) => (
                        <div
                          key={room.id}
                          className="truncate px-2 py-1 text-xs text-muted-foreground"
                        >
                          {room.name}
                        </div>
                      ))}
                    {rooms.filter((r) => r.siteId === site.id).length === 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground/60">Keine Räume</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
      </div>

      <div className="border-t border-sidebar-border p-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm',
              isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent',
            )
          }
        >
          <Settings className="h-4 w-4" />
          Einstellungen
        </NavLink>
      </div>

      <SiteFormDialog open={siteFormOpen} onOpenChange={setSiteFormOpen} />
    </aside>
  )
}
