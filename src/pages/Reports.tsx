import { useRef, useState } from 'react'
import { FileText, Upload, Trash2, Package, ShieldAlert, Building2, QrCode } from 'lucide-react'
import { QrLabelSheet } from '@/components/qr-label-sheet'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canViewSecrets } from '@/lib/permissions'
import { decryptString } from '@/lib/crypto'
import { fileToDataUrl } from '@/lib/files'
import {
  clearReportLogo,
  generateInventoryReport,
  generateSiteReport,
  generateWarrantyReport,
  getReportLogo,
  setReportLogo,
  type DecryptedCredential,
} from '@/lib/pdf-report'
import { toast } from '@/store/toastStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Reports() {
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const documents = useDataStore((s) => s.documents)
  const changelog = useDataStore((s) => s.changelog)
  const credentials = useDataStore((s) => s.credentials)
  const dataKey = useAuthStore((s) => s.dataKey)
  const role = useAuthStore((s) => s.currentUser?.role)

  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [logo, setLogo] = useState<string | null>(() => getReportLogo())
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [includeCredentials, setIncludeCredentials] = useState(false)
  const [labelSiteId, setLabelSiteId] = useState<string>('__all__')
  const [showLabels, setShowLabels] = useState(false)

  async function handleLogoUpload(file: File) {
    const dataUrl = await fileToDataUrl(file)
    setReportLogo(dataUrl)
    setLogo(dataUrl)
    toast({ title: 'Logo gespeichert', variant: 'success' })
  }

  function handleRemoveLogo() {
    clearReportLogo()
    setLogo(null)
  }

  async function handleSiteReport() {
    const site = sites.find((s) => s.id === selectedSiteId)
    if (!site) {
      toast({ title: 'Bitte Standort wählen', variant: 'destructive' })
      return
    }
    const siteDevices = devices.filter((d) => d.siteId === site.id)
    const siteDocuments = documents.filter((d) => d.siteId === site.id)
    const siteChangelog = changelog.filter((c) => c.siteId === site.id)

    let decryptedCredentials: DecryptedCredential[] | undefined
    if (includeCredentials && dataKey && canViewSecrets(role)) {
      const siteCredentials = credentials.filter((c) => c.siteId === site.id)
      decryptedCredentials = await Promise.all(
        siteCredentials.map(async (c) => ({
          title: c.title,
          username: c.username,
          password: await decryptString(c.encryptedPassword, dataKey),
          url: c.url,
        })),
      )
    }

    generateSiteReport({
      site,
      devices: siteDevices,
      documents: siteDocuments,
      changelog: siteChangelog,
      credentials: decryptedCredentials,
    })
    toast({ title: 'Standort-Report erstellt', variant: 'success' })
  }

  function handleInventoryReport() {
    generateInventoryReport(devices, sites)
    toast({ title: 'Inventar-Report erstellt', variant: 'success' })
  }

  function handleWarrantyReport() {
    generateWarrantyReport(devices, sites)
    toast({ title: 'Garantie-Report erstellt', variant: 'success' })
  }

  const labelDevices = labelSiteId === '__all__' ? devices : devices.filter((d) => d.siteId === labelSiteId)
  const labelSiteName = labelSiteId === '__all__' ? 'Alle Standorte' : sites.find((s) => s.id === labelSiteId)?.name ?? ''

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Clientseitig generierte PDF-Reports.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deckblatt-Logo</CardTitle>
          <CardDescription>Wird auf dem Deckblatt aller Reports verwendet.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="Logo" className="h-16 w-16 rounded-md border border-border object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
              Kein Logo
            </div>
          )}
          <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Logo hochladen
          </Button>
          {logo && (
            <Button variant="ghost" onClick={handleRemoveLogo}>
              <Trash2 className="h-4 w-4 text-destructive" /> Entfernen
            </Button>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleLogoUpload(file)
              e.target.value = ''
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Standort-Report
          </CardTitle>
          <CardDescription>Geräte, Dokumente und Änderungsprotokoll eines Standorts.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger>
              <SelectValue placeholder="Standort wählen" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canViewSecrets(role) && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeCredentials} onCheckedChange={(v) => setIncludeCredentials(v === true)} />
              <Label className="cursor-pointer font-normal">Zugangsdaten im Klartext einschließen</Label>
            </label>
          )}
          <Button className="w-fit" onClick={handleSiteReport} disabled={!selectedSiteId}>
            <FileText className="h-4 w-4" /> Standort-Report erstellen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Inventar-Report
          </CardTitle>
          <CardDescription>Gesamte Geräteliste aller Standorte, tabellarisch.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleInventoryReport}>
            <FileText className="h-4 w-4" /> Inventar-Report erstellen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Garantie-Report
          </CardTitle>
          <CardDescription>Alle Geräte mit Ablaufdatum, sortiert nach Dringlichkeit.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleWarrantyReport}>
            <FileText className="h-4 w-4" /> Garantie-Report erstellen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4" /> QR-Etiketten
          </CardTitle>
          <CardDescription>Druck-Layout für A4 (4×7-Raster), enthält Name/IP/Standort/Seriennummer.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Select value={labelSiteId} onValueChange={setLabelSiteId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle Standorte ({devices.length} Geräte)</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({devices.filter((d) => d.siteId === s.id).length} Geräte)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-fit" onClick={() => setShowLabels(true)} disabled={labelDevices.length === 0}>
            <QrCode className="h-4 w-4" /> Etiketten anzeigen &amp; drucken
          </Button>
        </CardContent>
      </Card>

      {showLabels && (
        <QrLabelSheet devices={labelDevices} siteName={labelSiteName} onClose={() => setShowLabels(false)} />
      )}
    </div>
  )
}
