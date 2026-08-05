import { useMemo, useState } from 'react'
import { Download, Plus, Search, Ticket as TicketIcon } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUSES,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { TicketList } from '@/components/tickets/ticket-list'
import { TicketFormDialog } from '@/components/tickets/ticket-form-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { downloadTicketsCsv } from '@/lib/export'

export function TicketsPage() {
  const tickets = useDataStore((s) => s.tickets)
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all' | 'unresolved'>('unresolved')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all')
  const [siteFilter, setSiteFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tickets.filter((t) => {
      if (statusFilter === 'unresolved' && (t.status === 'resolved' || t.status === 'closed'))
        return false
      if (statusFilter !== 'all' && statusFilter !== 'unresolved' && t.status !== statusFilter)
        return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      if (siteFilter !== 'all' && t.siteId !== siteFilter) return false
      if (!q) return true
      return [t.title, t.description, t.requester, t.assignee].join(' ').toLowerCase().includes(q)
    })
  }, [tickets, query, statusFilter, priorityFilter, categoryFilter, siteFilter])

  const openCount = tickets.filter((t) => t.status === 'open').length
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length
  const criticalCount = tickets.filter(
    (t) => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed',
  ).length

  function handleExportCsv() {
    const siteNameById = new Map(sites.map((s) => [s.id, s.name]))
    const deviceNameById = new Map(devices.map((d) => [d.id, d.name]))
    downloadTicketsCsv(filtered, siteNameById, deviceNameById)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted-foreground">Störungen und Anfragen der IT-Abteilung</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download /> CSV-Export
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Ticket anlegen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Offen</p>
            <p className="text-lg font-semibold">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In Bearbeitung</p>
            <p className="text-lg font-semibold">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Kritisch &amp; unerledigt</p>
            <p className="text-lg font-semibold">{criticalCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Titel, Beschreibung, Melder…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TicketStatus | 'all' | 'unresolved')}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unresolved">Unerledigt</SelectItem>
            <SelectItem value="all">Alle Status</SelectItem>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TICKET_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Alle Prioritäten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            {TICKET_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {TICKET_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as TicketCategory | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {TICKET_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {TICKET_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle Standorte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Standorte</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="Noch keine Tickets"
          description="Legen Sie das erste Ticket für Ihre IT-Abteilung an."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus /> Ticket anlegen
            </Button>
          }
        />
      ) : (
        <TicketList tickets={filtered} showLinks />
      )}

      <TicketFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
