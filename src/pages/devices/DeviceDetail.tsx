import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Pencil, Trash2, MapPin, QrCode } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DeviceFormDialog } from '@/pages/devices/DeviceFormDialog'
import { DeviceQrDialog } from '@/pages/devices/DeviceQrDialog'
import { CredentialsSection } from '@/components/sections/credentials-section'
import { DocumentsSection } from '@/components/sections/documents-section'
import { NotesSection } from '@/components/sections/notes-section'
import { ChangelogSection } from '@/components/sections/changelog-section'
import { InlineEditField } from '@/components/inline-edit-field'
import { DeviceIcon } from '@/lib/device-icons'
import { formatDateTime } from '@/lib/utils'
import { DEVICE_TYPES } from '@/types'
import type { Device } from '@/types'

export default function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const navigate = useNavigate()
  const device = useDataStore((s) => s.devices).find((d) => d.id === deviceId)
  const site = useDataStore((s) => s.sites).find((s2) => s2.id === device?.siteId)
  const room = useDataStore((s) => s.rooms).find((r) => r.id === device?.roomId)
  const deleteDevice = useDataStore((s) => s.deleteDevice)
  const updateDevice = useDataStore((s) => s.updateDevice)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  if (!device) {
    return <p className="text-sm text-muted-foreground">Gerät nicht gefunden.</p>
  }

  function save<K extends keyof Device>(field: K) {
    return (value: string) => updateDevice(device!.id, { [field]: value } as Pick<Device, K>)
  }

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
          <Button variant="outline" onClick={() => setQrOpen(true)}>
            <QrCode className="h-4 w-4" /> QR-Code
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Bearbeiten
          </Button>
          <Button variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 text-destructive" /> Löschen
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="network">Netzwerk</TabsTrigger>
          <TabsTrigger value="credentials">Zugangsdaten</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
          <TabsTrigger value="notes">Notizen</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-1 p-4 sm:grid-cols-2">
              <InlineEditField label="Hostname" value={device.hostname} onSave={save('hostname')} mono />
              <div className="flex flex-col gap-0.5 rounded-md p-1">
                <span className="text-xs text-muted-foreground">Typ</span>
                <span className="text-sm">{DEVICE_TYPES.find((t) => t.value === device.type)?.label}</span>
              </div>
              <InlineEditField label="Hersteller" value={device.manufacturer} onSave={save('manufacturer')} />
              <InlineEditField label="Modell" value={device.model} onSave={save('model')} />
              <InlineEditField label="Seriennummer" value={device.serialNumber} onSave={save('serialNumber')} mono />
              <InlineEditField label="Rack-Position" value={device.rackPosition} onSave={save('rackPosition')} />
              <InlineEditField label="Betriebssystem / Firmware" value={device.os} onSave={save('os')} />
              <InlineEditField label="Firmware-Version" value={device.firmwareVersion} onSave={save('firmwareVersion')} mono />
              <InlineEditField label="Kaufdatum" type="date" value={device.purchaseDate} onSave={save('purchaseDate')} />
              <InlineEditField label="Garantie bis" type="date" value={device.warrantyUntil} onSave={save('warrantyUntil')} />
              <InlineEditField label="Lieferant" value={device.supplier} onSave={save('supplier')} />
              <div className="flex flex-col gap-0.5 rounded-md p-1">
                <span className="text-xs text-muted-foreground">Zuletzt aktualisiert</span>
                <span className="text-sm">{formatDateTime(device.updatedAt)}</span>
              </div>
              <div className="sm:col-span-2">
                <InlineEditField
                  label="Beschreibung / Notizen"
                  type="textarea"
                  value={device.notes}
                  onSave={save('notes')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-1 p-4 sm:grid-cols-2">
              <InlineEditField label="IPv4-Adresse" value={device.ipv4} onSave={save('ipv4')} mono />
              <InlineEditField label="IPv6-Adresse" value={device.ipv6} onSave={save('ipv6')} mono />
              <InlineEditField label="Subnetz" value={device.subnet} onSave={save('subnet')} mono />
              <InlineEditField label="Gateway" value={device.gateway} onSave={save('gateway')} mono />
              <InlineEditField label="MAC-Adresse" value={device.mac} onSave={save('mac')} mono />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsSection deviceId={device.id} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsSection deviceId={device.id} />
        </TabsContent>
        <TabsContent value="changelog">
          <ChangelogSection deviceId={device.id} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesSection deviceId={device.id} />
        </TabsContent>
      </Tabs>

      <DeviceFormDialog open={editOpen} onOpenChange={setEditOpen} device={device} />
      <DeviceQrDialog open={qrOpen} onOpenChange={setQrOpen} device={device} />
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
