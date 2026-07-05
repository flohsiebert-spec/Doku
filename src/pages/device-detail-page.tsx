import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Pencil, Server, Trash2 } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { DEVICE_TYPE_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeviceFormDialog } from '@/components/devices/device-form-dialog'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CredentialList } from '@/components/credentials/credential-list'
import { CredentialFormDialog } from '@/components/credentials/credential-form-dialog'
import { DocumentManager } from '@/components/documents/document-manager'
import { NoteManager } from '@/components/notes/note-manager'
import { ChangelogManager } from '@/components/devices/changelog-manager'
import { toast } from 'sonner'

export function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const navigate = useNavigate()
  const device = useDataStore((s) => s.devices.find((d) => d.id === deviceId))
  const site = useDataStore((s) => s.sites.find((x) => x.id === device?.siteId))
  const room = useDataStore((s) => s.rooms.find((r) => r.id === device?.roomId))
  const allCredentials = useDataStore((s) => s.credentials)
  const credentials = allCredentials.filter((c) => c.deviceId === deviceId)
  const removeDevice = useDataStore((s) => s.removeDevice)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [credDialogOpen, setCredDialogOpen] = useState(false)

  if (!device) return <Navigate to="/devices" replace />

  const allInfoRows: Array<[string, string]> = [
    ['Hostname', device.hostname],
    ['IPv4', device.ipv4],
    ['IPv6', device.ipv6],
    ['Subnetz', device.subnet],
    ['Gateway', device.gateway],
    ['MAC-Adresse', device.mac],
    ['Hersteller', device.manufacturer],
    ['Modell', device.model],
    ['Seriennummer', device.serialNumber],
    ['Betriebssystem / Firmware', device.osFirmware],
    ['Rack-Position', device.rackPosition],
    ['Lieferant', device.supplier],
    [
      'Kaufdatum',
      device.purchaseDate ? format(new Date(device.purchaseDate), 'dd.MM.yyyy', { locale: de }) : '',
    ],
    [
      'Garantie bis',
      device.warrantyUntil ? format(new Date(device.warrantyUntil), 'dd.MM.yyyy', { locale: de }) : '',
    ],
  ]
  const infoRows = allInfoRows.filter(([, value]) => value)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Server className="size-5 text-primary" />
            <h1 className="text-xl font-semibold">{device.name}</h1>
            <Badge variant="secondary">{DEVICE_TYPE_LABELS[device.type]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {site && (
              <Link to={`/sites/${site.id}`} className="hover:underline">
                {site.name}
              </Link>
            )}
            {room && <> · {room.name}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil /> Bearbeiten
          </Button>
          <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 /> Löschen
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-x-8 gap-y-2 p-4 sm:grid-cols-2">
          {infoRows.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">Keine weiteren Details erfasst.</p>
          ) : (
            infoRows.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-border/60 py-1 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono">{value}</span>
              </div>
            ))
          )}
          {device.notes && (
            <p className="text-sm text-muted-foreground sm:col-span-2">{device.notes}</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="credentials">
        <TabsList>
          <TabsTrigger value="credentials">Zugangsdaten</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="notes">Notizen</TabsTrigger>
          <TabsTrigger value="activity">Aktivität</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCredDialogOpen(true)}>
              Zugangsdaten anlegen
            </Button>
          </div>
          <CredentialList credentials={credentials} />
          <CredentialFormDialog
            open={credDialogOpen}
            onOpenChange={setCredDialogOpen}
            defaultDeviceId={device.id}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManager entityType="device" entityId={device.id} />
        </TabsContent>

        <TabsContent value="notes">
          <NoteManager entityType="device" entityId={device.id} />
        </TabsContent>

        <TabsContent value="activity">
          <ChangelogManager deviceId={device.id} siteId={device.siteId} />
        </TabsContent>
      </Tabs>

      <DeviceFormDialog open={editOpen} onOpenChange={setEditOpen} device={device} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Gerät löschen"
        description={`Möchten Sie "${device.name}" wirklich löschen? Zugehörige Zugangsdaten, Dokumente und Notizen werden ebenfalls entfernt.`}
        onConfirm={async () => {
          await removeDevice(device.id)
          toast.success('Gerät gelöscht.')
          navigate('/devices')
        }}
      />
    </div>
  )
}
