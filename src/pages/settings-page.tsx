import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Download, Upload } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useDataStore } from '@/store/useDataStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { downloadBackupJson, parseBackupFile, restoreBackup } from '@/lib/export'

export function SettingsPage() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const technicianName = useUIStore((s) => s.technicianName)
  const setTechnicianName = useUIStore((s) => s.setTechnicianName)
  const loadAll = useDataStore((s) => s.loadAll)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  async function handleExport() {
    await downloadBackupJson()
    toast.success('Backup wurde heruntergeladen.')
  }

  function handleFileSelected(file: File | null) {
    if (!file) return
    setPendingFile(file)
    setRestoreConfirmOpen(true)
  }

  async function handleRestore() {
    if (!pendingFile) return
    try {
      const text = await pendingFile.text()
      const data = parseBackupFile(text)
      await restoreBackup(data)
      await loadAll()
      toast.success('Backup wurde eingespielt.')
    } catch {
      toast.error('Backup konnte nicht eingespielt werden. Datei ungültig?')
    } finally {
      setPendingFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">Darstellung, Backup und Wiederherstellung</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Darstellung</CardTitle>
          <CardDescription>Farbschema der Anwendung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-xs space-y-1.5">
            <Label>Design</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Hell</SelectItem>
                <SelectItem value="dark">Dunkel</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="technician-name">Ihr Name (für Aktivitätsprotokolle)</Label>
            <Input
              id="technician-name"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup &amp; Wiederherstellung</CardTitle>
          <CardDescription>
            Exportieren Sie die komplette Datenbank als JSON-Datei. Zugangsdaten bleiben dabei
            verschlüsselt. Bewahren Sie Backups sicher auf.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleExport}>
            <Download /> Backup exportieren
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload /> Backup importieren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={restoreConfirmOpen}
        onOpenChange={setRestoreConfirmOpen}
        title="Backup einspielen"
        description="Dadurch werden alle aktuellen Daten (Standorte, Geräte, Zugangsdaten, Dokumente, Notizen) überschrieben. Fortfahren?"
        confirmLabel="Einspielen"
        onConfirm={() => {
          setRestoreConfirmOpen(false)
          void handleRestore()
        }}
      />
    </div>
  )
}
