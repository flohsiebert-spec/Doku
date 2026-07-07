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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DNS_RECORD_TYPES, type DnsEntry, type DnsRecordType } from '@/types'

interface DnsFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  entry?: DnsEntry
}

const emptyForm = { type: 'A' as DnsRecordType, name: '', value: '', ttl: '3600', scope: 'internal' as 'internal' | 'external' }

export function DnsFormDialog({ open, onOpenChange, siteId, entry }: DnsFormDialogProps) {
  const createDnsEntry = useDataStore((s) => s.createDnsEntry)
  const updateDnsEntry = useDataStore((s) => s.updateDnsEntry)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) {
      setForm(
        entry
          ? { type: entry.type, name: entry.name, value: entry.value, ttl: String(entry.ttl), scope: entry.scope }
          : emptyForm,
      )
    }
  }, [open, entry])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.value.trim()) return
    const data = { siteId, type: form.type, name: form.name, value: form.value, ttl: Number(form.ttl) || 3600, scope: form.scope }
    if (entry) {
      await updateDnsEntry(entry.id, data)
      toast({ title: 'DNS-Eintrag aktualisiert', variant: 'success' })
    } else {
      await createDnsEntry(data)
      toast({ title: 'DNS-Eintrag angelegt', variant: 'success' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? 'DNS-Eintrag bearbeiten' : 'Neuer DNS-Eintrag'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Typ</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as DnsRecordType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DNS_RECORD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sichtbarkeit</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v as 'internal' | 'external' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Intern</SelectItem>
                  <SelectItem value="external">Extern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dns-name">Name</Label>
            <Input id="dns-name" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="www.example.com" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dns-value">Wert</Label>
            <Input id="dns-value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="192.168.1.10" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dns-ttl">TTL (Sekunden)</Label>
            <Input id="dns-ttl" type="number" min={0} value={form.ttl} onChange={(e) => setForm({ ...form, ttl: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="submit">{entry ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
