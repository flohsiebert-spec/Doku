import { useState } from 'react'
import { Plus, KeyRound } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { CredentialRow } from '@/components/credential-row'
import { CredentialFormDialog } from '@/pages/credentials/CredentialFormDialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Credential } from '@/types'

interface CredentialsSectionProps {
  siteId?: string
  deviceId?: string
}

export function CredentialsSection({ siteId, deviceId }: CredentialsSectionProps) {
  const credentials = useDataStore((s) => s.credentials)
  const deleteCredential = useDataStore((s) => s.deleteCredential)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Credential | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = deviceId
    ? credentials.filter((c) => c.deviceId === deviceId)
    : credentials.filter((c) => c.siteId === siteId && !c.deviceId)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Zugangsdaten</h3>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Hinzufügen
          </Button>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <KeyRound className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Keine verknüpften Zugangsdaten.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <CredentialRow
              key={c.id}
              credential={c}
              onEdit={() => {
                setEditing(c)
                setFormOpen(true)
              }}
              onDelete={() => setDeleteId(c.id)}
            />
          ))}
        </div>
      )}
      <CredentialFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        credential={editing}
        defaultSiteId={siteId}
        defaultDeviceId={deviceId}
      />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Zugangsdaten löschen"
        description="Dieser Eintrag wird unwiderruflich gelöscht."
        onConfirm={() => deleteId && deleteCredential(deleteId)}
      />
    </div>
  )
}
