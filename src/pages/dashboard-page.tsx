import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { FileText, KeyRound, MapPin, Plus, Server, StickyNote } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEVICE_TYPE_LABELS, CHANGELOG_ACTION_LABELS } from '@/types'
import { EmptyState } from '@/components/common/empty-state'

export function DashboardPage() {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const credentials = useDataStore((s) => s.credentials)
  const documents = useDataStore((s) => s.documents)
  const notes = useDataStore((s) => s.notes)
  const changelog = useDataStore((s) => s.changelog)

  const recentChangelog = [...changelog]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  const deviceTypeCounts = devices.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1
    return acc
  }, {})

  const stats = [
    { label: 'Standorte', value: sites.length, icon: MapPin, to: '/sites' },
    { label: 'Geräte', value: devices.length, icon: Server, to: '/devices' },
    { label: 'Zugangsdaten', value: credentials.length, icon: KeyRound, to: '/credentials' },
    { label: 'Dokumente', value: documents.length, icon: FileText, to: '/documents' },
    { label: 'Notizen', value: notes.length, icon: StickyNote, to: '/notes' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Übersicht über Ihre IT-Infrastruktur</p>
        </div>
        <Button asChild>
          <Link to="/sites">
            <Plus /> Standort anlegen
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                  <stat.icon className="size-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Geräte nach Typ</CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Geräte erfasst.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(deviceTypeCounts).map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {DEVICE_TYPE_LABELS[type as keyof typeof DEVICE_TYPE_LABELS]}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Aktivitäten</CardTitle>
          </CardHeader>
          <CardContent>
            {recentChangelog.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Aktivitäten protokolliert.</p>
            ) : (
              <ul className="space-y-2">
                {recentChangelog.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.technician} ·{' '}
                        {format(new Date(entry.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {CHANGELOG_ACTION_LABELS[entry.action]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {sites.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="Noch keine Standorte"
          description="Legen Sie Ihren ersten Standort an, um mit der Dokumentation zu beginnen."
          action={
            <Button asChild size="sm">
              <Link to="/sites">
                <Plus /> Standort anlegen
              </Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
