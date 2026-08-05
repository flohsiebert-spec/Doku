import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { FileText, KeyRound, MapPin, Plus, Server, StickyNote, Ticket as TicketIcon } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEVICE_TYPE_LABELS, CHANGELOG_ACTION_LABELS } from '@/types'
import { EmptyState } from '@/components/common/empty-state'
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge'
import { TicketPriorityBadge } from '@/components/tickets/ticket-priority-badge'

export function DashboardPage() {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const credentials = useDataStore((s) => s.credentials)
  const documents = useDataStore((s) => s.documents)
  const notes = useDataStore((s) => s.notes)
  const changelog = useDataStore((s) => s.changelog)
  const tickets = useDataStore((s) => s.tickets)

  const recentChangelog = [...changelog]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  const openTickets = tickets
    .filter((t) => t.status !== 'resolved' && t.status !== 'closed')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)

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
    { label: 'Offene Tickets', value: openTickets.length, icon: TicketIcon, to: '/tickets' },
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Offene Tickets</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/tickets">Alle ansehen</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {openTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine offenen Tickets. Gute Arbeit!</p>
          ) : (
            <ul className="space-y-2">
              {openTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.assignee || 'Nicht zugewiesen'} ·{' '}
                        {format(new Date(ticket.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <TicketPriorityBadge priority={ticket.priority} />
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
