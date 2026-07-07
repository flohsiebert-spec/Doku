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
import type { Rack } from '@/types'

interface RackFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  rack?: Rack
}

export function RackFormDialog({ open, onOpenChange, siteId, rack }: RackFormDialogProps) {
  const createRack = useDataStore((s) => s.createRack)
  const updateRack = useDataStore((s) => s.updateRack)
  const [name, setName] = useState('')
  const [heightU, setHeightU] = useState('42')

  useEffect(() => {
    if (open) {
      setName(rack?.name ?? '')
      setHeightU(rack ? String(rack.heightU) : '42')
    }
  }, [open, rack])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const height = Number(heightU)
    if (!name.trim() || !Number.isInteger(height) || height < 1) return
    const data = { siteId, name, heightU: height }
    if (rack) {
      await updateRack(rack.id, data)
      toast({ title: 'Rack aktualisiert', variant: 'success' })
    } else {
      await createRack(data)
      toast({ title: 'Rack angelegt', variant: 'success' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rack ? 'Rack bearbeiten' : 'Neues Rack'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rack-name">Name</Label>
            <Input id="rack-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Rack A" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rack-height">Höhe (HE)</Label>
            <Input id="rack-height" type="number" min={1} max={60} value={heightU} onChange={(e) => setHeightU(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit">{rack ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
