import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '@/types'
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUSES,
} from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { useUIStore } from '@/store/useUIStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TicketFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket?: Ticket
  defaultSiteId?: string | null
  defaultDeviceId?: string | null
}

const EMPTY = {
  title: '',
  description: '',
  status: 'open' as TicketStatus,
  priority: 'medium' as TicketPriority,
  category: 'other' as TicketCategory,
  siteId: '' as string,
  deviceId: '' as string,
  requester: '',
  assignee: '',
  dueDate: '',
}

export function TicketFormDialog({
  open,
  onOpenChange,
  ticket,
  defaultSiteId,
  defaultDeviceId,
}: TicketFormDialogProps) {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const createTicket = useDataStore((s) => s.createTicket)
  const updateTicket = useDataStore((s) => s.updateTicket)
  const technicianName = useUIStore((s) => s.technicianName)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        ticket
          ? {
              ...ticket,
              siteId: ticket.siteId ?? '',
              deviceId: ticket.deviceId ?? '',
            }
          : {
              ...EMPTY,
              siteId: defaultSiteId ?? '',
              deviceId: defaultDeviceId ?? '',
              assignee: technicianName,
            },
      )
    }
  }, [open, ticket, defaultSiteId, defaultDeviceId, technicianName])

  const availableDevices = form.siteId ? devices.filter((d) => d.siteId === form.siteId) : devices

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Bitte einen Titel angeben.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        siteId: form.siteId || null,
        deviceId: form.deviceId || null,
      }
      if (ticket) {
        await updateTicket(ticket.id, payload)
        toast.success('Ticket aktualisiert.')
      } else {
        await createTicket(payload)
        toast.success('Ticket angelegt.')
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ticket ? 'Ticket bearbeiten' : 'Neues Ticket'}</DialogTitle>
          <DialogDescription>Störung, Anfrage oder Aufgabe für die IT-Abteilung erfassen.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">Titel</Label>
            <Input
              id="ticket-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Kurze Zusammenfassung des Problems"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-description">Beschreibung</Label>
            <Textarea
              id="ticket-description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Was ist das Problem? Was wurde bereits versucht?"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as TicketStatus })}
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
              <Label>Priorität</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as TicketPriority })}
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
            <div className="space-y-1.5">
              <Label>Kategorie</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as TicketCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {TICKET_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Standort</Label>
              <Select
                value={form.siteId || '__none'}
                onValueChange={(v) =>
                  setForm({ ...form, siteId: v === '__none' ? '' : v, deviceId: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kein Standort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Kein Standort</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Betroffenes Gerät</Label>
              <Select
                value={form.deviceId || '__none'}
                onValueChange={(v) => setForm({ ...form, deviceId: v === '__none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kein Gerät" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Kein Gerät</SelectItem>
                  {availableDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-requester">Melder</Label>
              <Input
                id="ticket-requester"
                value={form.requester}
                onChange={(e) => setForm({ ...form, requester: e.target.value })}
                placeholder="Name des Anfragenden"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-assignee">Zugewiesen an</Label>
              <Input
                id="ticket-assignee"
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                placeholder="Techniker/in"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-due">Fällig am</Label>
              <Input
                id="ticket-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {ticket ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
