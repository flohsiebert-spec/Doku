import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Room } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  room?: Room
}

export function RoomFormDialog({ open, onOpenChange, siteId, room }: RoomFormDialogProps) {
  const createRoom = useDataStore((s) => s.createRoom)
  const updateRoom = useDataStore((s) => s.updateRoom)
  const [form, setForm] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(room ? { name: room.name, description: room.description } : { name: '', description: '' })
    }
  }, [open, room])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (room) {
        await updateRoom(room.id, form)
        toast.success('Raum aktualisiert.')
      } else {
        await createRoom({ siteId, ...form })
        toast.success('Raum angelegt.')
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? 'Raum bearbeiten' : 'Neuer Raum / Bereich'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="room-name">Name</Label>
            <Input
              id="room-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z. B. Serverraum, EG-Büro"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-description">Beschreibung</Label>
            <Textarea
              id="room-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {room ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
