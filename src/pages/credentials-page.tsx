import { useMemo, useState } from 'react'
import { KeyRound, Plus, Search } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { CREDENTIAL_CATEGORIES, CREDENTIAL_CATEGORY_LABELS, type CredentialCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CredentialList } from '@/components/credentials/credential-list'
import { CredentialFormDialog } from '@/components/credentials/credential-form-dialog'
import { EmptyState } from '@/components/common/empty-state'

export function CredentialsPage() {
  const credentials = useDataStore((s) => s.credentials)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CredentialCategory | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return credentials.filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
      if (!q) return true
      return [c.title, c.username, c.url].join(' ').toLowerCase().includes(q)
    })
  }, [credentials, query, categoryFilter])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Zugangsdaten</h1>
          <p className="text-sm text-muted-foreground">
            Passwörter werden AES-256-verschlüsselt lokal gespeichert
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus /> Zugangsdaten anlegen
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Titel, Benutzername, URL…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CredentialCategory | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {CREDENTIAL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CREDENTIAL_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {credentials.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="Noch keine Zugangsdaten"
          description="Legen Sie den ersten Eintrag an."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus /> Zugangsdaten anlegen
            </Button>
          }
        />
      ) : (
        <CredentialList credentials={filtered} showLink />
      )}

      <CredentialFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
