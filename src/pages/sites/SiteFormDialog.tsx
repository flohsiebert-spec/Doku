import { useEffect, useState, type FormEvent } from 'react'
import { useDataStore } from '@/store/dataStore'
import { toast } from '@/store/toastStore'
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
import type { Site } from '@/types'

interface SiteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: Site
}

const emptyForm = {
  name: '',
  address: '',
  description: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
}

export function SiteFormDialog({ open, onOpenChange, site }: SiteFormDialogProps) {
  const createSite = useDataStore((s) => s.createSite)
  const updateSite = useDataStore((s) => s.updateSite)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) {
      setForm(
        site
          ? {
              name: site.name,
              address: site.address,
              description: site.description,
              contactPerson: site.contactPerson,
              contactEmail: site.contactEmail ?? '',
              contactPhone: site.contactPhone ?? '',
            }
          : emptyForm,
      )
    }
  }, [open, site])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (site) {
      await updateSite(site.id, form)
      toast({ title: 'Standort aktualisiert', variant: 'success' })
    } else {
      await createSite(form)
      toast({ title: 'Standort angelegt', variant: 'success' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{site ? 'Standort bearbeiten' : 'Neuer Standort'}</DialogTitle>
          <DialogDescription>Erfasse die Stammdaten des Standorts.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="site-name">Name</Label>
            <Input
              id="site-name"
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="site-address">Adresse</Label>
            <Input
              id="site-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-contact">Kontaktperson</Label>
              <Input
                id="site-contact"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-phone">Telefon</Label>
              <Input
                id="site-phone"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="site-email">E-Mail</Label>
            <Input
              id="site-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="site-description">Beschreibung</Label>
            <Textarea
              id="site-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{site ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
