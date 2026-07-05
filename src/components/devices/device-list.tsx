import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Device } from '@/types'
import { DEVICE_TYPE_LABELS } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DeviceFormDialog } from './device-form-dialog'
import { toast } from 'sonner'

interface DeviceListProps {
  devices: Device[]
  showSite?: boolean
}

export function DeviceList({ devices, showSite = false }: DeviceListProps) {
  const sites = useDataStore((s) => s.sites)
  const rooms = useDataStore((s) => s.rooms)
  const removeDevice = useDataStore((s) => s.removeDevice)
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null)

  const sorted = [...devices].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Typ</th>
            <th className="px-3 py-2 font-medium">IPv4</th>
            <th className="px-3 py-2 font-medium">MAC</th>
            {showSite && <th className="px-3 py-2 font-medium">Standort</th>}
            <th className="px-3 py-2 font-medium">Raum</th>
            <th className="px-3 py-2 font-medium">Modell</th>
            <th className="w-10 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((device) => {
            const site = sites.find((s) => s.id === device.siteId)
            const room = rooms.find((r) => r.id === device.roomId)
            return (
              <tr key={device.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2">
                  <Link to={`/devices/${device.id}`} className="font-medium hover:underline">
                    {device.name}
                  </Link>
                  {device.hostname && (
                    <p className="text-xs text-muted-foreground">{device.hostname}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary">{DEVICE_TYPE_LABELS[device.type]}</Badge>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{device.ipv4 || '–'}</td>
                <td className="px-3 py-2 font-mono text-xs">{device.mac || '–'}</td>
                {showSite && (
                  <td className="px-3 py-2">
                    {site ? (
                      <Link to={`/sites/${site.id}`} className="hover:underline">
                        {site.name}
                      </Link>
                    ) : (
                      '–'
                    )}
                  </td>
                )}
                <td className="px-3 py-2">{room?.name ?? '–'}</td>
                <td className="px-3 py-2">{device.model || '–'}</td>
                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditDevice(device)}>
                        <Pencil /> Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteDevice(device)}>
                        <Trash2 /> Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={showSite ? 8 : 7} className="px-3 py-6 text-center text-muted-foreground">
                Keine Geräte gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editDevice && (
        <DeviceFormDialog
          open={!!editDevice}
          onOpenChange={(o) => !o && setEditDevice(null)}
          device={editDevice}
        />
      )}

      <ConfirmDialog
        open={!!deleteDevice}
        onOpenChange={(o) => !o && setDeleteDevice(null)}
        title="Gerät löschen"
        description={`Möchten Sie "${deleteDevice?.name}" wirklich löschen? Zugehörige Zugangsdaten, Dokumente und Notizen werden ebenfalls entfernt.`}
        onConfirm={async () => {
          if (deleteDevice) {
            await removeDevice(deleteDevice.id)
            toast.success('Gerät gelöscht.')
          }
          setDeleteDevice(null)
        }}
      />
    </div>
  )
}
