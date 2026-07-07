import { useRef, useState } from 'react'
import { useDataStore } from '@/store/dataStore'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UploadCloud } from 'lucide-react'
import {
  IMPORTABLE_FIELDS,
  guessMapping,
  parseCsv,
  resolveDeviceType,
  type ImportableField,
  type ParsedCsv,
} from '@/lib/csv-import'

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const NONE = '__none__'

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const sites = useDataStore((s) => s.sites)
  const createDevice = useDataStore((s) => s.createDevice)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<Partial<Record<ImportableField, string>>>({})
  const [siteId, setSiteId] = useState('')
  const [importing, setImporting] = useState(false)

  function reset() {
    setParsed(null)
    setMapping({})
    setSiteId('')
    setImporting(false)
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const csv = parseCsv(text)
      setParsed(csv)
      setMapping(guessMapping(csv.headers))
    }
    reader.readAsText(file, 'utf-8')
  }

  async function handleImport() {
    if (!parsed || !siteId) return
    setImporting(true)
    try {
      let count = 0
      for (const row of parsed.rows) {
        const get = (field: ImportableField) => {
          const header = mapping[field]
          if (!header) return ''
          const idx = parsed.headers.indexOf(header)
          return idx >= 0 ? row[idx] ?? '' : ''
        }
        const name = get('name')
        if (!name.trim()) continue
        await createDevice({
          name,
          hostname: get('hostname'),
          type: resolveDeviceType(get('type')),
          ipv4: get('ipv4'),
          ipv6: get('ipv6'),
          subnet: get('subnet'),
          gateway: get('gateway'),
          mac: get('mac'),
          serialNumber: get('serialNumber'),
          manufacturer: get('manufacturer'),
          model: get('model'),
          os: get('os'),
          firmwareVersion: get('firmwareVersion'),
          rackPosition: get('rackPosition'),
          purchaseDate: get('purchaseDate'),
          warrantyUntil: get('warrantyUntil'),
          supplier: get('supplier'),
          notes: get('notes'),
          siteId,
          roomId: '',
          portCount: 0,
          rackId: '',
          rackUnit: null,
          heSize: 1,
        })
        count++
      }
      toast({ title: `${count} Geräte importiert`, variant: 'success' })
      onOpenChange(false)
      reset()
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Geräte aus CSV importieren</DialogTitle>
          <DialogDescription>
            Unterstützt CSV-Exporte aus Lansweeper, OCS Inventory oder generischen Tabellen (`,` oder `;` getrennt).
          </DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-sm text-muted-foreground hover:bg-accent"
          >
            <UploadCloud className="h-8 w-8" />
            CSV-Datei auswählen…
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Ziel-Standort</Label>
              <Select value={siteId} onValueChange={setSiteId}>
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
            </div>

            <div className="max-h-80 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Feld</th>
                    <th className="px-3 py-2">CSV-Spalte</th>
                  </tr>
                </thead>
                <tbody>
                  {IMPORTABLE_FIELDS.map((field) => (
                    <tr key={field.key} className="border-t border-border">
                      <td className="px-3 py-1.5 font-medium">{field.label}</td>
                      <td className="px-3 py-1.5">
                        <Select
                          value={mapping[field.key] ?? NONE}
                          onValueChange={(v) =>
                            setMapping((prev) => ({ ...prev, [field.key]: v === NONE ? undefined : v }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Nicht zuordnen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Nicht zuordnen</SelectItem>
                            {parsed.headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              {parsed.rows.length} Zeile(n) erkannt. Zeilen ohne zugeordneten Namen werden übersprungen.
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />

        {parsed && (
          <DialogFooter>
            <Button variant="outline" onClick={reset}>
              Andere Datei wählen
            </Button>
            <Button onClick={handleImport} disabled={!siteId || !mapping.name || importing}>
              {importing ? 'Importiere…' : `${parsed.rows.length} Geräte importieren`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
