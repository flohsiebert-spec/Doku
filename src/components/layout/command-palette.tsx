import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Server, KeyRound, FileText, NotebookText } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/store/uiStore'
import { useDataStore } from '@/store/dataStore'

interface Result {
  id: string
  type: 'site' | 'device' | 'credential' | 'document' | 'note'
  title: string
  subtitle: string
  path: string
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const credentials = useDataStore((s) => s.credentials)
  const documents = useDataStore((s) => s.documents)
  const notes = useDataStore((s) => s.notes)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Result[] = []

    for (const site of sites) {
      if (site.name.toLowerCase().includes(q) || site.address.toLowerCase().includes(q)) {
        out.push({ id: site.id, type: 'site', title: site.name, subtitle: site.address, path: `/sites/${site.id}` })
      }
    }
    for (const d of devices) {
      if (
        d.name.toLowerCase().includes(q) ||
        d.hostname.toLowerCase().includes(q) ||
        d.ipv4.toLowerCase().includes(q) ||
        d.ipv6.toLowerCase().includes(q) ||
        d.mac.toLowerCase().includes(q) ||
        d.serialNumber.toLowerCase().includes(q)
      ) {
        out.push({
          id: d.id,
          type: 'device',
          title: d.name,
          subtitle: [d.hostname, d.ipv4, d.mac].filter(Boolean).join(' · '),
          path: `/devices/${d.id}`,
        })
      }
    }
    for (const c of credentials) {
      if (c.title.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)) {
        out.push({ id: c.id, type: 'credential', title: c.title, subtitle: c.username, path: '/credentials' })
      }
    }
    for (const doc of documents) {
      if (doc.name.toLowerCase().includes(q) || doc.tags.some((t) => t.toLowerCase().includes(q))) {
        out.push({ id: doc.id, type: 'document', title: doc.name, subtitle: doc.tags.join(', '), path: '/documents' })
      }
    }
    for (const n of notes) {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        out.push({ id: n.id, type: 'note', title: n.title, subtitle: 'Notiz', path: '/notes' })
      }
    }
    return out.slice(0, 30)
  }, [query, sites, devices, credentials, documents, notes])

  const icons = {
    site: Building2,
    device: Server,
    credential: KeyRound,
    document: FileText,
    note: NotebookText,
  }

  function go(path: string) {
    navigate(path)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogTitle className="sr-only">Suche</DialogTitle>
        <div className="border-b border-border p-3">
          <Input
            autoFocus
            placeholder="Standorte, Geräte, IPs, MAC, Zugangsdaten, Dokumente, Notizen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() && results.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">Keine Ergebnisse.</p>
          )}
          {results.map((r) => {
            const Icon = icons[r.type]
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => go(r.path)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{r.title}</span>
                <span className="truncate text-xs text-muted-foreground">{r.subtitle}</span>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
