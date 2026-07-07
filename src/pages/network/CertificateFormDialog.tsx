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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Certificate } from '@/types'

interface CertificateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  certificate?: Certificate
}

const emptyForm = { domain: '', issuer: '', validUntil: '', deviceId: '', notes: '' }

export function CertificateFormDialog({ open, onOpenChange, siteId, certificate }: CertificateFormDialogProps) {
  const createCertificate = useDataStore((s) => s.createCertificate)
  const updateCertificate = useDataStore((s) => s.updateCertificate)
  const devices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) {
      setForm(
        certificate
          ? {
              domain: certificate.domain,
              issuer: certificate.issuer,
              validUntil: certificate.validUntil,
              deviceId: certificate.deviceId,
              notes: certificate.notes,
            }
          : emptyForm,
      )
    }
  }, [open, certificate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.domain.trim() || !form.validUntil) return
    const data = { siteId, ...form }
    if (certificate) {
      await updateCertificate(certificate.id, data)
      toast({ title: 'Zertifikat aktualisiert', variant: 'success' })
    } else {
      await createCertificate(data)
      toast({ title: 'Zertifikat angelegt', variant: 'success' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{certificate ? 'Zertifikat bearbeiten' : 'Neues Zertifikat'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cert-domain">Domain</Label>
            <Input id="cert-domain" autoFocus value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="example.com" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cert-issuer">Aussteller</Label>
              <Input id="cert-issuer" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="Let's Encrypt" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cert-valid">Gültig bis</Label>
              <Input id="cert-valid" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Gerät (optional)</Label>
            <Select value={form.deviceId || '__none__'} onValueChange={(v) => setForm({ ...form, deviceId: v === '__none__' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Kein Gerät" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Kein Gerät</SelectItem>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cert-notes">Notizen</Label>
            <Textarea id="cert-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="submit">{certificate ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
