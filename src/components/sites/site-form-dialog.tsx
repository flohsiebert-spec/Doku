import { useEffect, useState, type FormEvent } from 'react'
import type { Site } from '@/types'
import { useDataStore } from '@/store/useDataStore'
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
import { toast } from 'sonner'

interface SiteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: Site
}

const EMPTY = {
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
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        site
          ? {
              name: site.name,
              address: site.address,
              description: site.description,
              contactPerson: site.contactPerson,
              contactEmail: site.contactEmail,
              contactPhone: site.contactPhone,
            }
          : EMPTY,
      )
    }
  }, [open, site])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (site) {
        await updateSite(site.id, form)
        toast.success('Standort aktualisiert.')
      } else {
        await createSite(form)
        toast.success('Standort angelegt.')
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
          <DialogTitle>{site ? 'Standort bearbeiten' : 'Neuer Standort'}</DialogTitle>
          <DialogDescription>
            Grunddaten des Standorts, z. B. eines Büros, Rechenzentrums oder einer Filiale.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="site-name">Name</Label>
            <Input
              id="site-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-address">Adresse</Label>
            <Input
              id="site-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="site-contact">Kontaktperson</Label>
              <Input
                id="site-contact"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site-contact-phone">Telefon</Label>
              <Input
                id="site-contact-phone"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-contact-email">E-Mail</Label>
            <Input
              id="site-contact-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-description">Beschreibung</Label>
            <Textarea
              id="site-description"
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
              {site ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
