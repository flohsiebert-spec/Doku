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
import type { Vlan } from '@/types'

interface VlanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  vlan?: Vlan
}

export function VlanFormDialog({ open, onOpenChange, siteId, vlan }: VlanFormDialogProps) {
  const createVlan = useDataStore((s) => s.createVlan)
  const updateVlan = useDataStore((s) => s.updateVlan)
  const [form, setForm] = useState({ vlanId: '', name: '', description: '', subnet: '' })

  useEffect(() => {
    if (open) {
      setForm(
        vlan
          ? { vlanId: String(vlan.vlanId), name: vlan.name, description: vlan.description, subnet: vlan.subnet }
          : { vlanId: '', name: '', description: '', subnet: '' },
      )
    }
  }, [open, vlan])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const vlanId = Number(form.vlanId)
    if (!form.name.trim() || !Number.isInteger(vlanId) || vlanId < 1 || vlanId > 4094) return
    const data = { siteId, vlanId, name: form.name, description: form.description, subnet: form.subnet }
    if (vlan) {
      await updateVlan(vlan.id, data)
      toast({ title: 'VLAN aktualisiert', variant: 'success' })
    } else {
      await createVlan(data)
      toast({ title: 'VLAN angelegt', variant: 'success' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vlan ? 'VLAN bearbeiten' : 'Neues VLAN'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vlan-id">VLAN-ID</Label>
              <Input
                id="vlan-id"
                type="number"
                min={1}
                max={4094}
                autoFocus
                value={form.vlanId}
                onChange={(e) => setForm({ ...form, vlanId: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vlan-subnet">Subnetz</Label>
              <Input
                id="vlan-subnet"
                value={form.subnet}
                onChange={(e) => setForm({ ...form, subnet: e.target.value })}
                placeholder="192.168.10.0/24"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vlan-name">Name</Label>
            <Input id="vlan-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vlan-description">Beschreibung</Label>
            <Textarea
              id="vlan-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{vlan ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
