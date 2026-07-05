import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Server } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
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
import { DeviceIcon } from '@/lib/device-icons'
import { DEVICE_TYPES } from '@/types'

export default function DeviceList() {
  const devices = useDataStore((s) => s.devices)
  const sites = useDataStore((s) => s.sites)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)

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
          <p className="text-sm text-muted-foreground">Alle Geräte über alle Standorte hinweg.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Gerät anlegen
        </Button>
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Typ</th>
                <th className="px-3 py-2 font-medium">IPv4</th>
                <th className="px-3 py-2 font-medium">MAC</th>
                <th className="px-3 py-2 font-medium">Standort</th>
                <th className="px-3 py-2 font-medium">Modell</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const site = sites.find((s) => s.id === d.siteId)
                return (
                  <tr key={d.id} className="border-t border-border hover:bg-accent">
                    <td className="px-3 py-2">
                      <Link to={`/devices/${d.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                        <DeviceIcon type={d.type} className="h-4 w-4 text-muted-foreground" />
                        {d.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{DEVICE_TYPES.find((t) => t.value === d.type)?.label}</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{d.ipv4 || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{d.mac || '—'}</td>
                    <td className="px-3 py-2">
                      {site ? (
                        <Link to={`/sites/${site.id}`} className="hover:underline">
                          {site.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2">{d.model || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <DeviceFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
