import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { List, type RowComponentProps } from 'react-window'
import { FileUp, Plus, Search, Server } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DeviceFormDialog } from '@/pages/devices/DeviceFormDialog'
import { CsvImportDialog } from '@/pages/devices/CsvImportDialog'
import { DeviceIcon } from '@/lib/device-icons'
import { DEVICE_TYPES, type Device, type Site } from '@/types'

const GRID_COLS = 'grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center gap-2'
const VIRTUALIZE_THRESHOLD = 50
const ROW_HEIGHT = 44

function DeviceRow({ device, site, style }: { device: Device; site: Site | undefined; style?: CSSProperties }) {
  return (
    <div className={cn(GRID_COLS, 'border-t border-border px-3 py-2 text-sm hover:bg-accent')} style={{ height: ROW_HEIGHT, ...style }}>
      <Link to={`/devices/${device.id}`} className="flex items-center gap-2 truncate font-medium hover:text-primary">
        <DeviceIcon type={device.type} className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{device.name}</span>
      </Link>
      <Badge variant="outline" className="w-fit">
        {DEVICE_TYPES.find((t) => t.value === device.type)?.label}
      </Badge>
      <span className="truncate font-mono text-xs">{device.ipv4 || '—'}</span>
      <span className="truncate font-mono text-xs">{device.mac || '—'}</span>
      {site ? (
        <Link to={`/sites/${site.id}`} className="truncate hover:underline">
          {site.name}
        </Link>
      ) : (
        <span>—</span>
      )}
      <span className="truncate">{device.model || '—'}</span>
    </div>
  )
}

interface RowProps {
  devices: Device[]
  sites: Site[]
}

function VirtualRow({ index, style, devices, sites }: RowComponentProps<RowProps>) {
  const device = devices[index]
  return <DeviceRow device={device} site={sites.find((s) => s.id === device.siteId)} style={style} />
}

export default function DeviceList() {
  const devices = useDataStore((s) => s.devices)
  const sites = useDataStore((s) => s.sites)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return devices.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (siteFilter !== 'all' && d.siteId !== siteFilter) return false
      if (!q) return true
      return (
        d.name.toLowerCase().includes(q) ||
        d.hostname.toLowerCase().includes(q) ||
        d.ipv4.toLowerCase().includes(q) ||
        d.ipv6.toLowerCase().includes(q) ||
        d.mac.toLowerCase().includes(q) ||
        d.serialNumber.toLowerCase().includes(q)
      )
    })
  }, [devices, search, typeFilter, siteFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Geräte</h1>
          <p className="text-sm text-muted-foreground">
            Alle Geräte über alle Standorte hinweg ({devices.length}).
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4" /> CSV-Import
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Gerät anlegen
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Name, IP, MAC, Seriennummer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            {DEVICE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Standorte</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Server className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Keine Geräte gefunden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className={cn(GRID_COLS, 'bg-muted/50 px-3 py-2 text-left text-xs uppercase text-muted-foreground')}>
            <span>Name</span>
            <span>Typ</span>
            <span>IPv4</span>
            <span>MAC</span>
            <span>Standort</span>
            <span>Modell</span>
          </div>
          {filtered.length > VIRTUALIZE_THRESHOLD ? (
            <List
              rowComponent={VirtualRow}
              rowCount={filtered.length}
              rowHeight={ROW_HEIGHT}
              rowProps={{ devices: filtered, sites }}
              style={{ height: 600 }}
            />
          ) : (
            <div>
              {filtered.map((device) => (
                <DeviceRow key={device.id} device={device} site={sites.find((s) => s.id === device.siteId)} />
              ))}
            </div>
          )}
        </div>
      )}

      <DeviceFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
