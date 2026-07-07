import { useEffect, useMemo, useState } from 'react'
import { History, Download } from 'lucide-react'
import { auditLogRepo } from '@/db/repository'
import { useAuthStore } from '@/store/authStore'
import { auditLogToCsv } from '@/lib/csv'
import { downloadBlob, formatDateTime } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AuditAction, AuditLogEntry } from '@/types'

const ENTITY_TYPE_LABELS: Record<string, string> = {
  site: 'Standort',
  room: 'Raum',
  device: 'Gerät',
  credential: 'Zugangsdaten',
  note: 'Notiz',
  vlan: 'VLAN',
  cable: 'Kabel',
  rack: 'Rack',
  dns_entry: 'DNS-Eintrag',
  certificate: 'Zertifikat',
  user: 'Benutzer',
}

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Angelegt',
  update: 'Geändert',
  delete: 'Gelöscht',
}

const ACTION_VARIANTS: Record<AuditAction, 'success' | 'secondary' | 'destructive'> = {
  create: 'success',
  update: 'secondary',
  delete: 'destructive',
}

export default function AuditLog() {
  const users = useAuthStore((s) => s.users)
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userFilter, setUserFilter] = useState('all')
  const [entityTypeFilter, setEntityTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    auditLogRepo.getAll().then((all) => {
      setEntries(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setLoading(false)
    })
  }, [])

  const entityTypes = useMemo(() => Array.from(new Set(entries.map((e) => e.entityType))), [entries])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (userFilter !== 'all' && e.userId !== userFilter) return false
      if (entityTypeFilter !== 'all' && e.entityType !== entityTypeFilter) return false
      if (dateFrom && new Date(e.createdAt) < new Date(dateFrom)) return false
      if (dateTo && new Date(e.createdAt) > new Date(`${dateTo}T23:59:59`)) return false
      return true
    })
  }, [entries, userFilter, entityTypeFilter, dateFrom, dateTo])

  function handleExport() {
    const csv = auditLogToCsv(filtered)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `audit-log-${Date.now()}.csv`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit-Log</h1>
          <p className="text-sm text-muted-foreground">Vollständiges Änderungsprotokoll aller Objekte.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" /> CSV-Export
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Benutzer</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Objekttypen</SelectItem>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {ENTITY_TYPE_LABELS[t] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Von" />
        <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Bis" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Lade Protokoll…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <History className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Keine Einträge gefunden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={ACTION_VARIANTS[entry.action]}>{ACTION_LABELS[entry.action]}</Badge>
                  <Badge variant="outline">{ENTITY_TYPE_LABELS[entry.entityType] ?? entry.entityType}</Badge>
                  <span className="font-medium">{entry.entityLabel || '—'}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {entry.username} · {formatDateTime(entry.createdAt)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="text-muted-foreground">{entry.field}:</span>
                {entry.oldValue && (
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive line-through">
                    {entry.oldValue}
                  </span>
                )}
                {entry.newValue && (
                  <span className="rounded bg-success/10 px-1.5 py-0.5 text-success">{entry.newValue}</span>
                )}
                {!entry.oldValue && !entry.newValue && <span className="text-muted-foreground">—</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
