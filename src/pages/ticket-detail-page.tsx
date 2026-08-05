import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Pencil, Ticket as TicketIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDataStore } from '@/store/useDataStore'
import {
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUS_LABELS,
  TICKET_STATUSES,
  TICKET_CATEGORY_LABELS,
  type TicketPriority,
  type TicketStatus,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TicketPriorityBadge } from '@/components/tickets/ticket-priority-badge'
import { TicketFormDialog } from '@/components/tickets/ticket-form-dialog'
import { TicketComments } from '@/components/tickets/ticket-comments'
import { ConfirmDialog } from '@/components/common/confirm-dialog'

function fmt(date: string | null) {
  return date ? format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de }) : '–'
}

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const ticket = useDataStore((s) => s.tickets.find((t) => t.id === ticketId))
  const site = useDataStore((s) => s.sites.find((x) => x.id === ticket?.siteId))
  const device = useDataStore((s) => s.devices.find((x) => x.id === ticket?.deviceId))
  const updateTicket = useDataStore((s) => s.updateTicket)
  const removeTicket = useDataStore((s) => s.removeTicket)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!ticket) return <Navigate to="/tickets" replace />

  const metaRows: Array<[string, string]> = [
    ['Melder', ticket.requester || '–'],
    ['Zugewiesen an', ticket.assignee || '–'],
    ['Fällig am', ticket.dueDate ? format(new Date(ticket.dueDate), 'dd.MM.yyyy', { locale: de }) : '–'],
    ['Angelegt', fmt(ticket.createdAt)],
    ['Zuletzt geändert', fmt(ticket.updatedAt)],
    ['Gelöst am', fmt(ticket.resolvedAt)],
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TicketIcon className="size-5 text-primary" />
            <h1 className="text-xl font-semibold">{ticket.title}</h1>
            <Badge variant="secondary">{TICKET_CATEGORY_LABELS[ticket.category]}</Badge>
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {device ? (
              <Link to={`/devices/${device.id}`} className="hover:underline">
                Gerät: {device.name}
              </Link>
            ) : site ? (
              <Link to={`/sites/${site.id}`} className="hover:underline">
                Standort: {site.name}
              </Link>
            ) : (
              'Kein Standort- oder Gerätebezug'
            )}
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            value={ticket.status}
            onValueChange={(v) => updateTicket(ticket.id, { status: v as TicketStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TICKET_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TICKET_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Priorität</label>
          <Select
            value={ticket.priority}
            onValueChange={(v) => updateTicket(ticket.id, { priority: v as TicketPriority })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TICKET_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {TICKET_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beschreibung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{ticket.description || 'Keine Beschreibung.'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-x-8 gap-y-2 p-4 sm:grid-cols-2">
          {metaRows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-border/60 py-1 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kommentare</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketComments ticket={ticket} />
        </CardContent>
      </Card>

      <TicketFormDialog open={editOpen} onOpenChange={setEditOpen} ticket={ticket} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Ticket löschen"
        description={`Möchten Sie das Ticket "${ticket.title}" wirklich löschen?`}
        onConfirm={async () => {
          await removeTicket(ticket.id)
          toast.success('Ticket gelöscht.')
          navigate('/tickets')
        }}
      />
    </div>
  )
}
