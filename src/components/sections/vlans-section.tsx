import { useState } from 'react'
import { Plus, Network, Pencil, Trash2, Download } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { vlansToCsv } from '@/lib/csv'
import { downloadBlob } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { VlanFormDialog } from '@/pages/network/VlanFormDialog'
import type { Vlan } from '@/types'

interface VlansSectionProps {
  siteId: string
}

export function VlansSection({ siteId }: VlansSectionProps) {
  const vlans = useDataStore((s) => s.vlans).filter((v) => v.siteId === siteId)
  const cables = useDataStore((s) => s.cables).filter((c) => c.siteId === siteId)
  const deleteVlan = useDataStore((s) => s.deleteVlan)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Vlan | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sorted = vlans.slice().sort((a, b) => a.vlanId - b.vlanId)

  function handleExport() {
    const csv = vlansToCsv(vlans)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `vlans-${siteId}-${Date.now()}.csv`)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">VLANs</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} disabled={vlans.length === 0}>
            <Download className="h-4 w-4" /> CSV-Export
          </Button>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> VLAN anlegen
            </Button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <Network className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine VLANs angelegt.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">VLAN-ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Subnetz</th>
                <th className="px-3 py-2 font-medium">Beschreibung</th>
                <th className="px-3 py-2 font-medium">Ports</th>
                {canEdit && <th className="px-3 py-2 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {sorted.map((vlan) => {
                const portCount = cables.filter((c) => c.vlanId === vlan.id).length
                return (
                  <tr key={vlan.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Badge variant="secondary">{vlan.vlanId}</Badge>
                    </td>
                    <td className="px-3 py-2 font-medium">{vlan.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{vlan.subnet || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{vlan.description || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{portCount}</td>
                    {canEdit && (
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(vlan)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(vlan.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <VlanFormDialog open={formOpen} onOpenChange={setFormOpen} siteId={siteId} vlan={editing} />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="VLAN löschen"
        description="Verknüpfte Kabelports verlieren die VLAN-Zuordnung, werden aber nicht gelöscht."
        onConfirm={() => deleteId && deleteVlan(deleteId)}
      />
    </div>
  )
}
