import { Link } from 'react-router-dom'
import { Building2, Server, KeyRound, FileText, ListChecks, ArrowRight } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { countOpenTasksInNotes } from '@/lib/tasks'

export default function Dashboard() {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const credentials = useDataStore((s) => s.credentials)
  const documents = useDataStore((s) => s.documents)
  const notes = useDataStore((s) => s.notes)
  const changelog = useDataStore((s) => s.changelog)

  const openTasks = countOpenTasksInNotes(notes)

  const stats = [
    { label: 'Standorte', value: sites.length, icon: Building2, to: '/sites' },
    { label: 'Geräte', value: devices.length, icon: Server, to: '/devices' },
    { label: 'Zugangsdaten', value: credentials.length, icon: KeyRound, to: '/credentials' },
    { label: 'Dokumente', value: documents.length, icon: FileText, to: '/documents' },
    { label: 'Offene Aufgaben', value: openTasks, icon: ListChecks, to: '/notes' },
  ]

  const recentChanges = changelog
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Überblick über deine IT-Dokumentation.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-semibold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Standorte</CardTitle>
            <Link to="/sites" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Alle ansehen <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {sites.length === 0 && (
              <p className="text-sm text-muted-foreground">Noch keine Standorte angelegt.</p>
            )}
            {sites.slice(0, 6).map((site) => {
              const deviceCount = devices.filter((d) => d.siteId === site.id).length
              return (
                <Link
                  key={site.id}
                  to={`/sites/${site.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span>{site.name}</span>
                  <Badge variant="secondary">{deviceCount} Geräte</Badge>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Änderungen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recentChanges.length === 0 && (
              <p className="text-sm text-muted-foreground">Noch keine Einträge im Änderungsprotokoll.</p>
            )}
            {recentChanges.map((c) => (
              <div key={c.id} className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.description}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(c.date)}</span>
                </div>
                <span className="text-xs text-muted-foreground">Techniker: {c.technician || '—'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
