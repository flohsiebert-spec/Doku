import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, Building2, MapPin, User, Server, ListChecks, History } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { SiteFormDialog } from '@/pages/sites/SiteFormDialog'
import { RoomsDevicesSection } from '@/components/sections/rooms-devices-section'
import { IpamSection } from '@/components/sections/ipam-section'
import { NetworkDiagramSection } from '@/components/sections/network-diagram-section'
import { SiteImagesSection } from '@/components/sections/site-images-section'
import { CredentialsSection } from '@/components/sections/credentials-section'
import { DocumentsSection } from '@/components/sections/documents-section'
import { NotesSection } from '@/components/sections/notes-section'
import { ChangelogSection } from '@/components/sections/changelog-section'
import { formatDateTime } from '@/lib/utils'
import { countOpenTasksInNotes } from '@/lib/tasks'

export default function SiteDetail() {
  const { siteId } = useParams<{ siteId: string }>()
  const navigate = useNavigate()
  const site = useDataStore((s) => s.sites).find((x) => x.id === siteId)
  const devices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const notes = useDataStore((s) => s.notes).filter((n) => n.siteId === siteId)
  const changelog = useDataStore((s) => s.changelog).filter((c) => c.siteId === siteId)
  const deleteSite = useDataStore((s) => s.deleteSite)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!site) {
    return <p className="text-sm text-muted-foreground">Standort nicht gefunden.</p>
  }

  const openTasks = countOpenTasksInNotes(notes)
  const lastChange = [...devices.map((d) => d.updatedAt), ...changelog.map((c) => c.updatedAt), ...notes.map((n) => n.updatedAt)]
    .sort()
    .reverse()[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            {site.name}
          </h1>
          <div className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
            {site.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {site.address}
              </span>
            )}
            {site.contactPerson && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {site.contactPerson}
                {site.contactEmail ? ` · ${site.contactEmail}` : ''}
                {site.contactPhone ? ` · ${site.contactPhone}` : ''}
              </span>
            )}
          </div>
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

      {site.description && <p className="text-sm text-muted-foreground">{site.description}</p>}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Server className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xl font-semibold">{devices.length}</div>
              <div className="text-xs text-muted-foreground">Geräte</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xl font-semibold">{openTasks}</div>
              <div className="text-xs text-muted-foreground">Offene Aufgaben</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold">{formatDateTime(lastChange)}</div>
              <div className="text-xs text-muted-foreground">Letzte Änderung</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rooms">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="rooms">Räume & Geräte</TabsTrigger>
          <TabsTrigger value="ipam">IP-Adressen</TabsTrigger>
          <TabsTrigger value="diagram">Netzwerkdiagramm</TabsTrigger>
          <TabsTrigger value="images">Bilder</TabsTrigger>
          <TabsTrigger value="credentials">Zugangsdaten</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="notes">Notizen</TabsTrigger>
          <TabsTrigger value="changelog">Änderungsprotokoll</TabsTrigger>
        </TabsList>
        <TabsContent value="rooms">
          <RoomsDevicesSection siteId={site.id} />
        </TabsContent>
        <TabsContent value="ipam">
          <IpamSection siteId={site.id} />
        </TabsContent>
        <TabsContent value="diagram">
          <NetworkDiagramSection siteId={site.id} />
        </TabsContent>
        <TabsContent value="images">
          <SiteImagesSection siteId={site.id} />
        </TabsContent>
        <TabsContent value="credentials">
          <CredentialsSection siteId={site.id} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsSection siteId={site.id} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesSection siteId={site.id} />
        </TabsContent>
        <TabsContent value="changelog">
          <ChangelogSection siteId={site.id} />
        </TabsContent>
      </Tabs>

      <SiteFormDialog open={editOpen} onOpenChange={setEditOpen} site={site} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Standort löschen"
        description="Der Standort sowie alle Räume, Geräte, Zugangsdaten, Dokumente, Notizen und Protokolleinträge werden unwiderruflich gelöscht."
        onConfirm={() => {
          deleteSite(site.id)
          navigate('/sites')
        }}
      />
    </div>
  )
}
