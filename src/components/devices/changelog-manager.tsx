import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import type { ChangelogAction } from '@/types'
import { CHANGELOG_ACTIONS, CHANGELOG_ACTION_LABELS } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { useUIStore } from '@/store/useUIStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/empty-state'
import { History } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ChangelogManagerProps {
  deviceId: string
  siteId: string
}

export function ChangelogManager({ deviceId, siteId }: ChangelogManagerProps) {
  const changelog = useDataStore((s) => s.changelog)
  const addChangelogEntry = useDataStore((s) => s.addChangelogEntry)
  const technicianName = useUIStore((s) => s.technicianName)

  const entries = useMemo(
    () =>
      changelog
        .filter((c) => c.deviceId === deviceId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [changelog, deviceId],
  )

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    action: 'maintenance' as ChangelogAction,
    description: '',
    technician: technicianName,
  })

  async function handleSubmit() {
    if (!form.description.trim()) return
    await addChangelogEntry({ deviceId, siteId, ...form })
    setOpen(false)
    setForm({ action: 'maintenance', description: '', technician: technicianName })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus /> Aktivität erfassen
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={History} title="Noch keine Aktivitäten protokolliert" />
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm">
              <div className="min-w-0">
                <p>{entry.description}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.technician} ·{' '}
                  {format(new Date(entry.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {CHANGELOG_ACTION_LABELS[entry.action]}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktivität erfassen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Art</Label>
              <Select
                value={form.action}
                onValueChange={(v) => setForm({ ...form, action: v as ChangelogAction })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANGELOG_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {CHANGELOG_ACTION_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="changelog-desc">Beschreibung</Label>
              <Textarea
                id="changelog-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="changelog-tech">Techniker</Label>
              <Input
                id="changelog-tech"
                value={form.technician}
                onChange={(e) => setForm({ ...form, technician: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
