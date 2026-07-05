import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Building2, MapPin, Server } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteFormDialog } from '@/pages/sites/SiteFormDialog'

export default function SiteList() {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Standorte</h1>
          <p className="text-sm text-muted-foreground">Alle Standorte im Überblick.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Standort anlegen
        </Button>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Noch keine Standorte angelegt.</p>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Ersten Standort anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const deviceCount = devices.filter((d) => d.siteId === site.id).length
            return (
              <Link key={site.id} to={`/sites/${site.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {site.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {site.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {site.address}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5" /> {deviceCount} Geräte
                    </span>
                    {site.contactPerson && <span>Kontakt: {site.contactPerson}</span>}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <SiteFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
