import { useEffect, useState, type FormEvent } from 'react'
import { Dices } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { encryptString, decryptString } from '@/lib/crypto'
import { toast } from '@/store/toastStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PasswordGeneratorDialog } from '@/components/password-generator'
import { CREDENTIAL_CATEGORIES, type Credential, type CredentialCategory } from '@/types'

interface CredentialFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credential?: Credential
  defaultSiteId?: string
  defaultDeviceId?: string
}

const emptyForm = {
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  category: 'admin' as CredentialCategory,
  siteId: '',
  deviceId: '',
}

export function CredentialFormDialog({
  open,
  onOpenChange,
  credential,
  defaultSiteId,
  defaultDeviceId,
}: CredentialFormDialogProps) {
  const createCredential = useDataStore((s) => s.createCredential)
  const updateCredential = useDataStore((s) => s.updateCredential)
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const dataKey = useAuthStore((s) => s.dataKey)
  const [form, setForm] = useState(emptyForm)
  const [generatorOpen, setGeneratorOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    async function load() {
      if (credential && dataKey) {
        const password = await decryptString(credential.encryptedPassword, dataKey)
        setForm({
          title: credential.title,
          username: credential.username,
          password,
          url: credential.url,
          notes: credential.notes,
          category: credential.category,
          siteId: credential.siteId,
          deviceId: credential.deviceId,
        })
      } else {
        setForm({ ...emptyForm, siteId: defaultSiteId ?? '', deviceId: defaultDeviceId ?? '' })
      }
    }
    load()
  }, [open, credential, dataKey, defaultSiteId, defaultDeviceId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!dataKey || !form.title.trim()) return
    const encryptedPassword = await encryptString(form.password, dataKey)
    const data = {
      title: form.title,
      username: form.username,
      encryptedPassword,
      url: form.url,
      notes: form.notes,
      category: form.category,
      siteId: form.siteId,
      deviceId: form.deviceId,
    }
    if (credential) {
      await updateCredential(credential.id, data)
      toast({ title: 'Zugangsdaten aktualisiert', variant: 'success' })
    } else {
      await createCredential(data)
      toast({ title: 'Zugangsdaten gespeichert', variant: 'success' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{credential ? 'Zugangsdaten bearbeiten' : 'Neue Zugangsdaten'}</DialogTitle>
          <DialogDescription>
            Passwörter werden AES-256-verschlüsselt gespeichert.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cred-title">Titel</Label>
            <Input
              id="cred-title"
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cred-username">Benutzername</Label>
              <Input
                id="cred-username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Kategorie</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as CredentialCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREDENTIAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cred-password">Passwort</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cred-password"
                type="text"
                className="font-mono"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setGeneratorOpen(true)}>
                <Dices className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cred-url">URL / Hostname</Label>
            <Input
              id="cred-url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Standort (optional)</Label>
              <Select
                value={form.siteId || '__none__'}
                onValueChange={(v) => setForm({ ...form, siteId: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Kein Standort</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Gerät (optional)</Label>
              <Select
                value={form.deviceId || '__none__'}
                onValueChange={(v) => setForm({ ...form, deviceId: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Kein Gerät</SelectItem>
                  {devices
                    .filter((d) => !form.siteId || d.siteId === form.siteId)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cred-notes">Notizen</Label>
            <Textarea
              id="cred-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{credential ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
        <PasswordGeneratorDialog
          open={generatorOpen}
          onOpenChange={setGeneratorOpen}
          onUse={(password) => setForm((f) => ({ ...f, password }))}
        />
      </DialogContent>
    </Dialog>
  )
}
