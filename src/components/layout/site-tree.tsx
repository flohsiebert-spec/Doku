import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, DoorOpen, MapPin, Server } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { cn } from '@/lib/utils'

export function SiteTree() {
  const sites = useDataStore((s) => s.sites)
  const rooms = useDataStore((s) => s.rooms)
  const devices = useDataStore((s) => s.devices)
  const location = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const sortedSites = [...sites].sort((a, b) => a.name.localeCompare(b.name))

  if (sortedSites.length === 0) {
    return <p className="px-3 py-2 text-xs text-sidebar-foreground/60">Noch keine Standorte angelegt.</p>
  }

  return (
    <div className="flex flex-col gap-0.5">
      {sortedSites.map((site) => {
        const siteRooms = rooms
          .filter((r) => r.siteId === site.id)
          .sort((a, b) => a.name.localeCompare(b.name))
        const siteDeviceCount = devices.filter((d) => d.siteId === site.id).length
        const isOpen = expanded[site.id] ?? false
        const isActive = location.pathname === `/sites/${site.id}`

        return (
          <div key={site.id}>
            <div
              className={cn(
                'group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-accent font-medium',
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded((e) => ({ ...e, [site.id]: !isOpen }))}
                className="flex size-4 shrink-0 items-center justify-center text-sidebar-foreground/50"
                aria-label={isOpen ? 'Einklappen' : 'Ausklappen'}
              >
                {siteRooms.length > 0 && (
                  <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
                )}
              </button>
              <Link
                to={`/sites/${site.id}`}
                className="flex min-w-0 flex-1 items-center gap-1.5 truncate"
                title={site.name}
              >
                <MapPin className="size-3.5 shrink-0 text-sidebar-foreground/60" />
                <span className="truncate">{site.name}</span>
              </Link>
              <span className="shrink-0 text-xs text-sidebar-foreground/50">{siteDeviceCount}</span>
            </div>
            {isOpen && siteRooms.length > 0 && (
              <div className="ml-5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
                {siteRooms.map((room) => {
                  const roomDeviceCount = devices.filter((d) => d.roomId === room.id).length
                  const isRoomActive = location.search === `?room=${room.id}` && isActive
                  return (
                    <Link
                      key={room.id}
                      to={`/sites/${site.id}?room=${room.id}`}
                      className={cn(
                        'flex items-center gap-1.5 truncate rounded-md px-2 py-1 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent',
                        isRoomActive && 'bg-sidebar-accent font-medium text-sidebar-foreground',
                      )}
                      title={room.name}
                    >
                      <DoorOpen className="size-3 shrink-0" />
                      <span className="truncate flex-1">{room.name}</span>
                      {roomDeviceCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-sidebar-foreground/50">
                          <Server className="size-2.5" />
                          {roomDeviceCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
