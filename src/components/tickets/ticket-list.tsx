import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Ticket } from '@/types'
import { TICKET_CATEGORY_LABELS } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { TicketStatusBadge } from './ticket-status-badge'
import { TicketPriorityBadge } from './ticket-priority-badge'
import { TicketFormDialog } from './ticket-form-dialog'

interface TicketListProps {
  tickets: Ticket[]
  showLinks?: boolean
}

export function TicketList({ tickets, showLinks = false }: TicketListProps) {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const removeTicket = useDataStore((s) => s.removeTicket)
  const [editTicket, setEditTicket] = useState<Ticket | null>(null)
  const [deleteTicket, setDeleteTicket] = useState<Ticket | null>(null)

  const sorted = [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Titel</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Priorität</th>
            <th className="px-3 py-2 font-medium">Kategorie</th>
            {showLinks && <th className="px-3 py-2 font-medium">Bezug</th>}
            <th className="px-3 py-2 font-medium">Zugewiesen</th>
            <th className="px-3 py-2 font-medium">Aktualisiert</th>
            <th className="w-10 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((ticket) => {
            const site = sites.find((s) => s.id === ticket.siteId)
            const device = devices.find((d) => d.id === ticket.deviceId)
            return (
              <tr key={ticket.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2">
                  <Link to={`/tickets/${ticket.id}`} className="font-medium hover:underline">
                    {ticket.title}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <TicketStatusBadge status={ticket.status} />
                </td>
                <td className="px-3 py-2">
                  <TicketPriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary">{TICKET_CATEGORY_LABELS[ticket.category]}</Badge>
                </td>
                {showLinks && (
                  <td className="px-3 py-2">
                    {device ? (
                      <Link to={`/devices/${device.id}`} className="hover:underline">
                        {device.name}
                      </Link>
                    ) : site ? (
                      <Link to={`/sites/${site.id}`} className="hover:underline">
                        {site.name}
                      </Link>
                    ) : (
                      '–'
                    )}
                  </td>
                )}
                <td className="px-3 py-2">{ticket.assignee || '–'}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {format(new Date(ticket.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                </td>
                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTicket(ticket)}>
                        <Pencil /> Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTicket(ticket)}>
                        <Trash2 /> Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={showLinks ? 8 : 7}
                className="px-3 py-6 text-center text-muted-foreground"
              >
                Keine Tickets gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editTicket && (
        <TicketFormDialog
          open={!!editTicket}
          onOpenChange={(o) => !o && setEditTicket(null)}
          ticket={editTicket}
        />
      )}

      <ConfirmDialog
        open={!!deleteTicket}
        onOpenChange={(o) => !o && setDeleteTicket(null)}
        title="Ticket löschen"
        description={`Möchten Sie das Ticket "${deleteTicket?.title}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteTicket) {
            await removeTicket(deleteTicket.id)
            toast.success('Ticket gelöscht.')
          }
          setDeleteTicket(null)
        }}
      />
    </div>
  )
}
