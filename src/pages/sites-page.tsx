import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { MapPin, Phone, Plus, Server, User } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { SiteFormDialog } from '@/components/sites/site-form-dialog'

export function SitesPage() {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const changelog = useDataStore((s) => s.changelog)
  const [dialogOpen, setDialogOpen] = useState(false)

  const sortedSites = [...sites].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Standorte</h1>
          <p className="text-sm text-muted-foreground">Alle Standorte und Niederlassungen im Überblick</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus /> Standort anlegen
        </Button>
      </div>

      {sortedSites.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Noch keine Standorte"
          description="Legen Sie Ihren ersten Standort an."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus /> Standort anlegen
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSites.map((site) => {
            const deviceCount = devices.filter((d) => d.siteId === site.id).length
            const lastChange = changelog
              .filter((c) => c.siteId === site.id)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

            return (
              <Link key={site.id} to={`/sites/${site.id}`}>
                <Card className="h-full transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="size-4 text-primary" />
                      {site.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {site.address && <p className="truncate">{site.address}</p>}
                    {site.contactPerson && (
                      <p className="flex items-center gap-1.5">
                        <User className="size-3.5" /> {site.contactPerson}
                      </p>
                    )}
                    {site.contactPhone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3.5" /> {site.contactPhone}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="flex items-center gap-1">
                        <Server className="size-3.5" /> {deviceCount} Geräte
                      </span>
                      {lastChange && (
                        <span>
                          Zuletzt: {format(new Date(lastChange.createdAt), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <SiteFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
