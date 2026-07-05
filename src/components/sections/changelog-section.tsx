import { useState, type FormEvent } from 'react'
import { History, Plus, Trash2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { formatDateTime } from '@/lib/utils'
import type { ChangelogEntry } from '@/types'

interface ChangelogSectionProps {
  siteId?: string
  deviceId?: string
}

const ACTION_LABELS: Record<ChangelogEntry['action'], string> = {
  change: 'Änderung',
  maintenance: 'Wartung',
  restart: 'Neustart',
  install: 'Installation',
  other: 'Sonstiges',
}

export function ChangelogSection({ siteId, deviceId }: ChangelogSectionProps) {
  const changelog = useDataStore((s) => s.changelog)
  const createChangelogEntry = useDataStore((s) => s.createChangelogEntry)
  const deleteChangelogEntry = useDataStore((s) => s.deleteChangelogEntry)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    description: '',
    technician: '',
    action: 'change' as ChangelogEntry['action'],
  })

  const filtered = deviceId
    ? changelog.filter((c) => c.deviceId === deviceId)
    : changelog.filter((c) => c.siteId === siteId && !c.deviceId)

  const sorted = filtered.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.description.trim()) return
    await createChangelogEntry({
      date: new Date().toISOString(),
      description: form.description,
      technician: form.technician,
      action: form.action,
      siteId: siteId ?? '',
      deviceId: deviceId ?? '',
    })
    setForm({ description: '', technician: '', action: 'change' })
    setFormOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Änderungsprotokoll</h3>
        <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Eintrag hinzufügen
        </Button>
      </div>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <History className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ACTION_LABELS[entry.action]}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(entry.date)}</span>
                </div>
                <p className="text-sm">{entry.description}</p>
                <p className="text-xs text-muted-foreground">Techniker: {entry.technician || '—'}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(entry.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Änderungsprotokoll-Eintrag</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Art</Label>
              <Select
                value={form.action}
                onValueChange={(v) => setForm({ ...form, action: v as ChangelogEntry['action'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-description">Beschreibung</Label>
              <Textarea
                id="cl-description"
                autoFocus
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-technician">Techniker</Label>
              <Input
                id="cl-technician"
                value={form.technician}
                onChange={(e) => setForm({ ...form, technician: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Eintrag speichern</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eintrag löschen"
        description="Dieser Änderungsprotokoll-Eintrag wird gelöscht."
        onConfirm={() => deleteId && deleteChangelogEntry(deleteId)}
      />
    </div>
  )
}
