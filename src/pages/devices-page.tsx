import { useMemo, useState } from 'react'
import { Download, Plus, Search, Server } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { DEVICE_TYPES, DEVICE_TYPE_LABELS, type DeviceType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DeviceList } from '@/components/devices/device-list'
import { DeviceFormDialog } from '@/components/devices/device-form-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { downloadDevicesCsv } from '@/lib/export'

export function DevicesPage() {
  const devices = useDataStore((s) => s.devices)
  const sites = useDataStore((s) => s.sites)
  const rooms = useDataStore((s) => s.rooms)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DeviceType | 'all'>('all')
  const [siteFilter, setSiteFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return devices.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (siteFilter !== 'all' && d.siteId !== siteFilter) return false
      if (!q) return true
      return [d.name, d.hostname, d.ipv4, d.ipv6, d.mac, d.serialNumber]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [devices, query, typeFilter, siteFilter])

  function handleExportCsv() {
    const siteNameById = new Map(sites.map((s) => [s.id, s.name]))
    const roomNameById = new Map(rooms.map((r) => [r.id, r.name]))
    downloadDevicesCsv(filtered, siteNameById, roomNameById)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Geräte</h1>
          <p className="text-sm text-muted-foreground">Alle Geräte über alle Standorte hinweg</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download /> CSV-Export
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Gerät anlegen
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Name, IP, MAC, Seriennummer…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as DeviceType | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Alle Typen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            {DEVICE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {DEVICE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle Standorte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Standorte</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {devices.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Noch keine Geräte"
          description="Legen Sie Ihr erstes Gerät an."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus /> Gerät anlegen
            </Button>
          }
        />
      ) : (
        <DeviceList devices={filtered} showSite />
      )}

      <DeviceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
