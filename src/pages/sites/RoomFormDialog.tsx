import { useEffect, useState, type FormEvent } from 'react'
import { useDataStore } from '@/store/dataStore'
import { toast } from '@/store/toastStore'
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
import type { Room } from '@/types'

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  room?: Room
}

export function RoomFormDialog({ open, onOpenChange, siteId, room }: RoomFormDialogProps) {
  const createRoom = useDataStore((s) => s.createRoom)
  const updateRoom = useDataStore((s) => s.updateRoom)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setName(room?.name ?? '')
      setDescription(room?.description ?? '')
    }
  }, [open, room])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (room) {
      await updateRoom(room.id, { name, description })
      toast({ title: 'Raum aktualisiert', variant: 'success' })
    } else {
      await createRoom({ siteId, name, description })
      toast({ title: 'Raum angelegt', variant: 'success' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? 'Raum bearbeiten' : 'Neuer Raum / Bereich'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="room-name">Name</Label>
            <Input id="room-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="room-description">Beschreibung</Label>
            <Textarea id="room-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit">{room ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
