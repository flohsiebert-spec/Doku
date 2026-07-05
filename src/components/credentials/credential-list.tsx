import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Credential } from '@/types'
import { CREDENTIAL_CATEGORY_LABELS } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { useAuthStore } from '@/store/useAuthStore'
import { decryptString } from '@/crypto/crypto'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CredentialFormDialog } from './credential-form-dialog'

interface CredentialListProps {
  credentials: Credential[]
  showLink?: boolean
}

function CredentialPasswordCell({ credential }: { credential: Credential }) {
  const key = useAuthStore((s) => s.key)
  const [revealed, setRevealed] = useState<string | null>(null)

  async function toggleReveal() {
    if (revealed) {
      setRevealed(null)
      return
    }
    if (!credential.encryptedPassword || !key) {
      toast.error('Kein Passwort hinterlegt.')
      return
    }
    try {
      const plain = await decryptString(key, credential.encryptedPassword)
      setRevealed(plain)
    } catch {
      toast.error('Entschlüsselung fehlgeschlagen.')
    }
  }

  async function copyPassword() {
    if (!credential.encryptedPassword || !key) {
      toast.error('Kein Passwort hinterlegt.')
      return
    }
    try {
      const plain = await decryptString(key, credential.encryptedPassword)
      await navigator.clipboard.writeText(plain)
      toast.success('Passwort kopiert.')
    } catch {
      toast.error('Entschlüsselung fehlgeschlagen.')
    }
  }

  if (!credential.encryptedPassword) {
    return <span className="text-xs text-muted-foreground">–</span>
  }

  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      <span className="min-w-24">{revealed ?? '••••••••••'}</span>
      <Button variant="ghost" size="icon" className="size-6" onClick={toggleReveal}>
        {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="size-6" onClick={copyPassword}>
        <Copy className="size-3.5" />
      </Button>
    </div>
  )
}

export function CredentialList({ credentials, showLink = false }: CredentialListProps) {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const removeCredential = useDataStore((s) => s.removeCredential)
  const [editCred, setEditCred] = useState<Credential | null>(null)
  const [deleteCred, setDeleteCred] = useState<Credential | null>(null)

  async function copyUsername(username: string) {
    await navigator.clipboard.writeText(username)
    toast.success('Benutzername kopiert.')
  }

  const sorted = [...credentials].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Titel</th>
            <th className="px-3 py-2 font-medium">Kategorie</th>
            <th className="px-3 py-2 font-medium">Benutzername</th>
            <th className="px-3 py-2 font-medium">Passwort</th>
            <th className="px-3 py-2 font-medium">URL</th>
            {showLink && <th className="px-3 py-2 font-medium">Verknüpfung</th>}
            <th className="w-10 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((cred) => {
            const site = sites.find((s) => s.id === cred.siteId)
            const device = devices.find((d) => d.id === cred.deviceId)
            return (
              <tr key={cred.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2 font-medium">{cred.title}</td>
                <td className="px-3 py-2">
                  <Badge variant="secondary">{CREDENTIAL_CATEGORY_LABELS[cred.category]}</Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span>{cred.username || '–'}</span>
                    {cred.username && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => copyUsername(cred.username)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <CredentialPasswordCell credential={cred} />
                </td>
                <td className="px-3 py-2 max-w-40 truncate">{cred.url || '–'}</td>
                {showLink && (
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {device ? `Gerät: ${device.name}` : site ? `Standort: ${site.name}` : '–'}
                  </td>
                )}
                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditCred(cred)}>
                        <Pencil /> Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteCred(cred)}>
                        <Trash2 /> Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={showLink ? 7 : 6} className="px-3 py-6 text-center text-muted-foreground">
                Keine Zugangsdaten gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editCred && (
        <CredentialFormDialog
          open={!!editCred}
          onOpenChange={(o) => !o && setEditCred(null)}
          credential={editCred}
        />
      )}

      <ConfirmDialog
        open={!!deleteCred}
        onOpenChange={(o) => !o && setDeleteCred(null)}
        title="Zugangsdaten löschen"
        description={`Möchten Sie "${deleteCred?.title}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteCred) {
            await removeCredential(deleteCred.id)
            toast.success('Zugangsdaten gelöscht.')
          }
          setDeleteCred(null)
        }}
      />
    </div>
  )
}
