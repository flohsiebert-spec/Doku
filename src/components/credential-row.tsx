import { useState } from 'react'
import { Eye, EyeOff, Copy, Pencil, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { decryptString } from '@/lib/crypto'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/store/toastStore'
import { CREDENTIAL_CATEGORIES, type Credential } from '@/types'

interface CredentialRowProps {
  credential: Credential
  onEdit: () => void
  onDelete: () => void
  contextLabel?: string
}

export function CredentialRow({ credential, onEdit, onDelete, contextLabel }: CredentialRowProps) {
  const key = useAuthStore((s) => s.key)
  const [revealed, setRevealed] = useState<string | null>(null)

  async function reveal() {
    if (revealed !== null) {
      setRevealed(null)
      return
    }
    if (!key) return
    const plain = await decryptString(credential.encryptedPassword, key)
    setRevealed(plain)
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value)
    toast({ title: `${label} kopiert` })
  }

  async function copyPassword() {
    if (!key) return
    const plain = await decryptString(credential.encryptedPassword, key)
    await copy(plain, 'Passwort')
  }

  const category = CREDENTIAL_CATEGORIES.find((c) => c.value === credential.category)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{credential.title}</span>
          <Badge variant="outline">{category?.label}</Badge>
          {contextLabel && <Badge variant="secondary">{contextLabel}</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {credential.username && (
            <button onClick={() => copy(credential.username, 'Benutzername')} className="flex items-center gap-1 hover:text-foreground">
              {credential.username} <Copy className="h-3 w-3" />
            </button>
          )}
          <button onClick={reveal} className="flex items-center gap-1 font-mono hover:text-foreground">
            {revealed !== null ? revealed : '••••••••'}
            {revealed !== null ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
          <button onClick={copyPassword} className="flex items-center gap-1 hover:text-foreground">
            Kopieren <Copy className="h-3 w-3" />
          </button>
          {credential.url && <span className="truncate">{credential.url}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 self-end sm:self-auto">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
