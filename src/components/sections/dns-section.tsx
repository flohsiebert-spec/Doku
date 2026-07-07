import { useState } from 'react'
import { Plus, Globe, Pencil, Trash2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DnsFormDialog } from '@/pages/network/DnsFormDialog'
import type { DnsEntry } from '@/types'

interface DnsSectionProps {
  siteId: string
}

export function DnsSection({ siteId }: DnsSectionProps) {
  const entries = useDataStore((s) => s.dnsEntries).filter((e) => e.siteId === siteId)
  const deleteDnsEntry = useDataStore((s) => s.deleteDnsEntry)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DnsEntry | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">DNS-Einträge</h3>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> DNS-Eintrag anlegen
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <Globe className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine DNS-Einträge.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Typ</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Wert</th>
                <th className="px-3 py-2 font-medium">TTL</th>
                <th className="px-3 py-2 font-medium">Sichtbarkeit</th>
                {canEdit && <th className="px-3 py-2 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Badge variant="outline">{entry.type}</Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.value}</td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.ttl}s</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary">{entry.scope === 'internal' ? 'Intern' : 'Extern'}</Badge>
                  </td>
                  {canEdit && (
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(entry)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(entry.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DnsFormDialog open={formOpen} onOpenChange={setFormOpen} siteId={siteId} entry={editing} />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="DNS-Eintrag löschen"
        description="Dieser DNS-Eintrag wird unwiderruflich gelöscht."
        onConfirm={() => deleteId && deleteDnsEntry(deleteId)}
      />
    </div>
  )
}
