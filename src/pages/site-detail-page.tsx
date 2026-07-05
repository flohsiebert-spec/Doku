import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Mail, MapPin, Pencil, Phone, Plus, Server, Trash2, User, X } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SiteFormDialog } from '@/components/sites/site-form-dialog'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { RoomManager } from '@/components/sites/room-manager'
import { DeviceList } from '@/components/devices/device-list'
import { DeviceFormDialog } from '@/components/devices/device-form-dialog'
import { IpamView } from '@/components/sites/ipam-view'
import { DocumentManager } from '@/components/documents/document-manager'
import { NoteManager } from '@/components/notes/note-manager'
import { CredentialList } from '@/components/credentials/credential-list'
import { CredentialFormDialog } from '@/components/credentials/credential-form-dialog'
import { toast } from 'sonner'

export function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeRoomId = searchParams.get('room')

  const site = useDataStore((s) => s.sites.find((x) => x.id === siteId))
  const rooms = useDataStore((s) => s.rooms)
  const allDevices = useDataStore((s) => s.devices)
  const allCredentials = useDataStore((s) => s.credentials)
  const allChangelog = useDataStore((s) => s.changelog)
  const devices = allDevices.filter((d) => d.siteId === siteId)
  const credentials = allCredentials.filter((c) => c.siteId === siteId)
  const changelog = allChangelog.filter((c) => c.siteId === siteId)
  const removeSite = useDataStore((s) => s.removeSite)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [credDialogOpen, setCredDialogOpen] = useState(false)

  if (!site) return <Navigate to="/sites" replace />

  const activeRoom = rooms.find((r) => r.id === activeRoomId)
  const visibleDevices = activeRoomId ? devices.filter((d) => d.roomId === activeRoomId) : devices

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-primary" />
            <h1 className="text-xl font-semibold">{site.name}</h1>
          </div>
          {site.address && <p className="mt-1 text-sm text-muted-foreground">{site.address}</p>}
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Geräte</p>
            <p className="text-lg font-semibold">{devices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Räume/Bereiche</p>
            <p className="text-lg font-semibold">{rooms.filter((r) => r.siteId === siteId).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Letzte Änderung</p>
            <p className="text-lg font-semibold">
              {changelog.length > 0
                ? format(
                    new Date(
                      [...changelog].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0].createdAt,
                    ),
                    'dd.MM.yyyy',
                    { locale: de },
                  )
                : '–'}
            </p>
          </CardContent>
        </Card>
      </div>

      {(site.contactPerson || site.contactEmail || site.contactPhone || site.description) && (
        <Card>
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
            {site.contactPerson && (
              <p className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted-foreground" /> {site.contactPerson}
              </p>
            )}
            {site.contactPhone && (
              <p className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground" /> {site.contactPhone}
              </p>
            )}
            {site.contactEmail && (
              <p className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground" /> {site.contactEmail}
              </p>
            )}
            {site.description && (
              <p className="text-sm text-muted-foreground sm:col-span-2">{site.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Räume</TabsTrigger>
          <TabsTrigger value="devices">Geräte</TabsTrigger>
          <TabsTrigger value="ipam">IPAM</TabsTrigger>
          <TabsTrigger value="credentials">Zugangsdaten</TabsTrigger>
          <TabsTrigger value="images">Bilder</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="notes">Notizen</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <RoomManager siteId={site.id} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-3">
          {activeRoom && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                Raum: {activeRoom.name}
                <button onClick={() => navigate(`/sites/${site.id}`)} aria-label="Filter entfernen">
                  <X className="size-3" />
                </button>
              </Badge>
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDeviceDialogOpen(true)}>
              <Plus /> Gerät anlegen
            </Button>
          </div>
          {visibleDevices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <Server className="mx-auto mb-2 size-6" /> Keine Geräte in dieser Ansicht.
            </p>
          ) : (
            <DeviceList devices={visibleDevices} />
          )}
          <DeviceFormDialog
            open={deviceDialogOpen}
            onOpenChange={setDeviceDialogOpen}
            defaultSiteId={site.id}
            defaultRoomId={activeRoomId}
          />
        </TabsContent>

        <TabsContent value="ipam">
          <IpamView devices={devices} />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCredDialogOpen(true)}>
              <Plus /> Zugangsdaten anlegen
            </Button>
          </div>
          <CredentialList credentials={credentials} />
          <CredentialFormDialog
            open={credDialogOpen}
            onOpenChange={setCredDialogOpen}
            defaultSiteId={site.id}
          />
        </TabsContent>

        <TabsContent value="images">
          <DocumentManager entityType="site" entityId={site.id} imagesOnly title="Grundrisse, Fotos, Netzwerkpläne" />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManager entityType="site" entityId={site.id} />
        </TabsContent>

        <TabsContent value="notes">
          <NoteManager entityType="site" entityId={site.id} />
        </TabsContent>
      </Tabs>

      <SiteFormDialog open={editOpen} onOpenChange={setEditOpen} site={site} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Standort löschen"
        description={`Möchten Sie "${site.name}" wirklich löschen? Alle Räume, Geräte, Zugangsdaten, Dokumente und Notizen dieses Standorts werden ebenfalls gelöscht.`}
        onConfirm={async () => {
          await removeSite(site.id)
          toast.success('Standort gelöscht.')
          navigate('/sites')
        }}
      />
    </div>
  )
}
