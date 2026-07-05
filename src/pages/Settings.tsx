import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Download, Upload, KeyRound, Trash2, FileSpreadsheet, Moon, Sun } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { createBackup, restoreBackup, applyBackup } from '@/lib/backup'
import { devicesToCsv } from '@/lib/csv'
import { downloadBlob } from '@/lib/utils'
import { changeMasterPassword, decryptString, encryptString } from '@/lib/crypto'
import { credentialsRepo, wipeAllData } from '@/db/repository'
import { toast } from '@/store/toastStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'

export default function Settings() {
  const key = useAuthStore((s) => s.key)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const devices = useDataStore((s) => s.devices)
  const sites = useDataStore((s) => s.sites)
  const loadAll = useDataStore((s) => s.loadAll)

  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [importPassword, setImportPassword] = useState('')
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [wipeOpen, setWipeOpen] = useState(false)

  async function handleExportJson() {
    if (!key) return
    const json = await createBackup(key)
    downloadBlob(new Blob([json], { type: 'application/json' }), `it-doku-backup-${Date.now()}.json`)
    toast({ title: 'Backup exportiert', variant: 'success' })
  }

  function handleExportCsv() {
    const csv = devicesToCsv(devices, sites)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `geraete-${Date.now()}.csv`)
    toast({ title: 'CSV exportiert', variant: 'success' })
  }

  function selectImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingImportFile(file)
    e.target.value = ''
  }

  async function confirmImport(e: FormEvent) {
    e.preventDefault()
    if (!pendingImportFile) return
    try {
      const content = await pendingImportFile.text()
      const data = await restoreBackup(content, importPassword)
      await applyBackup(data)
      await loadAll()
      toast({ title: 'Backup wiederhergestellt', variant: 'success' })
      setPendingImportFile(null)
      setImportPassword('')
    } catch {
      toast({ title: 'Import fehlgeschlagen', description: 'Falsches Passwort oder ungültige Datei.', variant: 'destructive' })
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    const ok = await changeMasterPassword(oldPassword, newPassword, async (oldKey, newKey) => {
      const all = await credentialsRepo.getAll()
      for (const cred of all) {
        const plain = await decryptString(cred.encryptedPassword, oldKey)
        const reencrypted = await encryptString(plain, newKey)
        await credentialsRepo.update(cred.id, { encryptedPassword: reencrypted })
      }
      useAuthStore.setState({ key: newKey })
    })
    if (ok) {
      toast({ title: 'Master-Passwort geändert', variant: 'success' })
      setOldPassword('')
      setNewPassword('')
      await loadAll()
    } else {
      toast({ title: 'Falsches aktuelles Passwort', variant: 'destructive' })
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">Backup, Export und Sicherheit.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Darstellung</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Dark Mode</span>
          <Button variant="outline" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Hell' : 'Dunkel'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Export</CardTitle>
          <CardDescription>
            Der JSON-Export enthält die komplette Datenbank verschlüsselt mit deinem Master-Passwort.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportJson}>
              <Download className="h-4 w-4" /> JSON-Backup exportieren
            </Button>
            <Button variant="outline" onClick={handleExportCsv}>
              <FileSpreadsheet className="h-4 w-4" /> Geräteliste als CSV
            </Button>
            <Button variant="outline" onClick={() => importInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Backup importieren
            </Button>
            <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={selectImportFile} />
          </div>

          {pendingImportFile && (
            <form onSubmit={confirmImport} className="flex flex-col gap-2 rounded-md border border-border p-3">
              <p className="text-sm">
                Datei <strong>{pendingImportFile.name}</strong> wird geladen. Bitte das Master-Passwort
                eingeben, mit dem dieses Backup erstellt wurde.
              </p>
              <Label htmlFor="import-password">Master-Passwort des Backups</Label>
              <Input
                id="import-password"
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                required
              />
              <p className="text-xs text-destructive">
                Achtung: Der Import überschreibt alle aktuell gespeicherten Daten.
              </p>
              <div className="flex gap-2">
                <Button type="submit">Wiederherstellen</Button>
                <Button type="button" variant="outline" onClick={() => setPendingImportFile(null)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Master-Passwort ändern
          </CardTitle>
          <CardDescription>Alle gespeicherten Zugangsdaten werden neu verschlüsselt.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="old-password">Aktuelles Passwort</Label>
              <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input
                id="new-password"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-fit">
              Passwort ändern
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
          <CardDescription>Alle Daten unwiderruflich löschen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setWipeOpen(true)}>
            <Trash2 className="h-4 w-4" /> Alle Daten löschen
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={wipeOpen}
        onOpenChange={setWipeOpen}
        title="Alle Daten löschen"
        description="Sämtliche Standorte, Geräte, Zugangsdaten, Dokumente, Notizen und Protokolleinträge werden unwiderruflich gelöscht. Erstelle vorher ein Backup."
        onConfirm={async () => {
          await wipeAllData()
          await loadAll()
          toast({ title: 'Alle Daten gelöscht', variant: 'success' })
        }}
      />
    </div>
  )
}
