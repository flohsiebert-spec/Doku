import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Credential, CredentialCategory } from '@/types'
import { CREDENTIAL_CATEGORIES, CREDENTIAL_CATEGORY_LABELS } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { useAuthStore } from '@/store/useAuthStore'
import { encryptString } from '@/crypto/crypto'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PasswordGeneratorPopover } from './password-generator-popover'

interface CredentialFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credential?: Credential
  defaultSiteId?: string | null
  defaultDeviceId?: string | null
}

type LinkType = 'none' | 'site' | 'device'

const EMPTY = {
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  category: 'other' as CredentialCategory,
}

export function CredentialFormDialog({
  open,
  onOpenChange,
  credential,
  defaultSiteId = null,
  defaultDeviceId = null,
}: CredentialFormDialogProps) {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const createCredential = useDataStore((s) => s.createCredential)
  const updateCredential = useDataStore((s) => s.updateCredential)
  const key = useAuthStore((s) => s.key)

  const [form, setForm] = useState(EMPTY)
  const [linkType, setLinkType] = useState<LinkType>('none')
  const [siteId, setSiteId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (credential) {
      setForm({
        title: credential.title,
        username: credential.username,
        password: '',
        url: credential.url,
        notes: credential.notes,
        category: credential.category,
      })
      if (credential.deviceId) {
        setLinkType('device')
        setDeviceId(credential.deviceId)
        setSiteId('')
      } else if (credential.siteId) {
        setLinkType('site')
        setSiteId(credential.siteId)
        setDeviceId('')
      } else {
        setLinkType('none')
      }
    } else {
      setForm(EMPTY)
      if (defaultDeviceId) {
        setLinkType('device')
        setDeviceId(defaultDeviceId)
      } else if (defaultSiteId) {
        setLinkType('site')
        setSiteId(defaultSiteId)
      } else {
        setLinkType('none')
        setSiteId('')
        setDeviceId('')
      }
    }
  }, [open, credential, defaultSiteId, defaultDeviceId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!key) {
      toast.error('Nicht entsperrt.')
      return
    }
    setSubmitting(true)
    try {
      const encryptedPassword = form.password
        ? await encryptString(key, form.password)
        : (credential?.encryptedPassword ?? null)

      const payload = {
        title: form.title,
        username: form.username,
        url: form.url,
        notes: form.notes,
        category: form.category,
        encryptedPassword,
        siteId: linkType === 'site' ? siteId || null : null,
        deviceId: linkType === 'device' ? deviceId || null : null,
      }

      if (credential) {
        await updateCredential(credential.id, payload)
        toast.success('Zugangsdaten aktualisiert.')
      } else {
        await createCredential(payload)
        toast.success('Zugangsdaten angelegt.')
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{credential ? 'Zugangsdaten bearbeiten' : 'Neue Zugangsdaten'}</DialogTitle>
          <DialogDescription>
            Passwörter werden AES-256-verschlüsselt lokal gespeichert.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cred-title">Titel</Label>
              <Input
                id="cred-title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
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
                    <SelectItem key={c} value={c}>
                      {CREDENTIAL_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-username">Benutzername</Label>
            <Input
              id="cred-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-password">
              Passwort {credential && <span className="text-muted-foreground">(leer lassen für unverändert)</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id="cred-password"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={credential ? '••••••••' : ''}
                className="font-mono"
              />
              <PasswordGeneratorPopover onGenerate={(pw) => setForm({ ...form, password: pw })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-url">URL / Hostname</Label>
            <Input
              id="cred-url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Verknüpfung</Label>
              <Select value={linkType} onValueChange={(v) => setLinkType(v as LinkType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="site">Standort</SelectItem>
                  <SelectItem value="device">Gerät</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {linkType === 'site' && (
              <div className="col-span-2 space-y-1.5">
                <Label>Standort</Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Standort wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {linkType === 'device' && (
              <div className="col-span-2 space-y-1.5">
                <Label>Gerät</Label>
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gerät wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cred-notes">Notizen</Label>
            <Textarea
              id="cred-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {credential ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
