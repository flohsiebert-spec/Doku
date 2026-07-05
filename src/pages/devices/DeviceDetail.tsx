import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Pencil, Trash2, MapPin } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DeviceFormDialog } from '@/pages/devices/DeviceFormDialog'
import { CredentialsSection } from '@/components/sections/credentials-section'
import { DocumentsSection } from '@/components/sections/documents-section'
import { NotesSection } from '@/components/sections/notes-section'
import { ChangelogSection } from '@/components/sections/changelog-section'
import { DeviceIcon } from '@/lib/device-icons'
import { formatDate, formatDateTime } from '@/lib/utils'
import { DEVICE_TYPES } from '@/types'

export default function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const navigate = useNavigate()
  const device = useDataStore((s) => s.devices).find((d) => d.id === deviceId)
  const site = useDataStore((s) => s.sites).find((s2) => s2.id === device?.siteId)
  const room = useDataStore((s) => s.rooms).find((r) => r.id === device?.roomId)
  const deleteDevice = useDataStore((s) => s.deleteDevice)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!device) {
    return <p className="text-sm text-muted-foreground">Gerät nicht gefunden.</p>
  }

  const fields: [string, string | undefined][] = [
    ['Hostname', device.hostname],
    ['IPv4', device.ipv4],
    ['IPv6', device.ipv6],
    ['Subnetz', device.subnet],
    ['Gateway', device.gateway],
    ['MAC-Adresse', device.mac],
    ['Seriennummer', device.serialNumber],
    ['Hersteller', device.manufacturer],
    ['Modell', device.model],
    ['Rack-Position', device.rackPosition],
    ['Betriebssystem / Firmware', device.os],
    ['Firmware-Version', device.firmwareVersion],
    ['Kaufdatum', device.purchaseDate ? formatDate(device.purchaseDate) : undefined],
    ['Garantie bis', device.warrantyUntil ? formatDate(device.warrantyUntil) : undefined],
    ['Lieferant', device.supplier],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <DeviceIcon type={device.type} className="h-5 w-5 text-primary" />
            {device.name}
          </h1>
          {site && (
            <Link to={`/sites/${site.id}`} className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:underline">
              <MapPin className="h-3.5 w-3.5" />
              {site.name}
              {room ? ` · ${room.name}` : ''}
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Bearbeiten
          </Button>
          <Button variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 text-destructive" /> Löschen
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="credentials">Zugangsdaten</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="notes">Notizen</TabsTrigger>
          <TabsTrigger value="changelog">Änderungsprotokoll</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-3 p-4 sm:grid-cols-2">
              {fields
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="font-mono text-sm">{value}</span>
                  </div>
                ))}
              {device.notes && (
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Beschreibung / Notizen</span>
                  <span className="whitespace-pre-wrap text-sm">{device.notes}</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Typ</span>
                <span className="text-sm">{DEVICE_TYPES.find((t) => t.value === device.type)?.label}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Zuletzt aktualisiert</span>
                <span className="text-sm">{formatDateTime(device.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="credentials">
          <CredentialsSection deviceId={device.id} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsSection deviceId={device.id} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesSection deviceId={device.id} />
        </TabsContent>
        <TabsContent value="changelog">
          <ChangelogSection deviceId={device.id} />
        </TabsContent>
      </Tabs>

      <DeviceFormDialog open={editOpen} onOpenChange={setEditOpen} device={device} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Gerät löschen"
        description="Das Gerät sowie verknüpfte Zugangsdaten, Dokumente, Notizen und Protokolleinträge werden unwiderruflich gelöscht."
        onConfirm={() => {
          deleteDevice(device.id)
          navigate(site ? `/sites/${site.id}` : '/devices')
        }}
      />
    </div>
  )
}
