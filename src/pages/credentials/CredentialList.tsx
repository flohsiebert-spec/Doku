import { useMemo, useState } from 'react'
import { Plus, KeyRound, Search } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CredentialRow } from '@/components/credential-row'
import { CredentialFormDialog } from '@/pages/credentials/CredentialFormDialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CREDENTIAL_CATEGORIES, type Credential } from '@/types'

export default function CredentialList() {
  const credentials = useDataStore((s) => s.credentials)
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const deleteCredential = useDataStore((s) => s.deleteCredential)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Credential | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return credentials.filter((c) => {
      if (category !== 'all' && c.category !== category) return false
      if (!q) return true
      return (
        c.title.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.url.toLowerCase().includes(q)
      )
    })
  }, [credentials, search, category])

  function contextLabel(c: Credential): string | undefined {
    if (c.deviceId) return devices.find((d) => d.id === c.deviceId)?.name
    if (c.siteId) return sites.find((s) => s.id === c.siteId)?.name
    return undefined
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Zugangsdaten</h1>
          <p className="text-sm text-muted-foreground">Verschlüsselter Credential Store.</p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Zugangsdaten anlegen
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Suche nach Titel, Benutzername, URL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {CREDENTIAL_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <KeyRound className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Keine Zugangsdaten gefunden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <CredentialRow
              key={c.id}
              credential={c}
              contextLabel={contextLabel(c)}
              onEdit={() => {
                setEditing(c)
                setFormOpen(true)
              }}
              onDelete={() => setDeleteId(c.id)}
            />
          ))}
        </div>
      )}

      <CredentialFormDialog open={formOpen} onOpenChange={setFormOpen} credential={editing} />
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
