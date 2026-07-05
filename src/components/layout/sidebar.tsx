import { NavLink } from 'react-router-dom'
import {
  FileText,
  KeyRound,
  LayoutDashboard,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Settings,
  StickyNote,
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { cn } from '@/lib/utils'
import { SiteTree } from './site-tree'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/sites', label: 'Standorte', icon: MapPin },
  { to: '/devices', label: 'Geräte', icon: Server },
  { to: '/credentials', label: 'Zugangsdaten', icon: KeyRound },
  { to: '/documents', label: 'Dokumente', icon: FileText },
  { to: '/notes', label: 'Notizen', icon: StickyNote },
]

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <aside
      className={cn(
        'flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all',
        collapsed ? 'w-14' : 'w-64',
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight">Doku · IT-Dokumentation</span>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent"
          aria-label={collapsed ? 'Sidebar öffnen' : 'Sidebar einklappen'}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-accent',
                collapsed && 'justify-center px-0',
              )
            }
            title={item.label}
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <>
          <div className="mt-1 flex items-center justify-between px-4 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
              Standorte
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <SiteTree />
          </div>
        </>
      )}

      {collapsed && <div className="flex-1" />}

      <div className="border-t border-sidebar-border p-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-sidebar-accent',
              isActive && 'bg-sidebar-accent',
              collapsed && 'justify-center px-0',
            )
          }
          title="Einstellungen"
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">Einstellungen</span>}
        </NavLink>
      </div>
    </aside>
  )
}
