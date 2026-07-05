import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, KeyRound, MapPin, Search, Server, StickyNote } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { Input } from '@/components/ui/input'
import { DEVICE_TYPE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  icon: typeof Server
  label: string
  sublabel: string
  path: string
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const navigate = useNavigate()

  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const credentials = useDataStore((s) => s.credentials)
  const documents = useDataStore((s) => s.documents)
  const notes = useDataStore((s) => s.notes)

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    const out: SearchResult[] = []

    for (const site of sites) {
      if (site.name.toLowerCase().includes(q) || site.address.toLowerCase().includes(q)) {
        out.push({ id: site.id, icon: MapPin, label: site.name, sublabel: site.address || 'Standort', path: `/sites/${site.id}` })
      }
    }

    for (const device of devices) {
      const haystack = [device.name, device.hostname, device.ipv4, device.ipv6, device.mac, device.serialNumber]
        .join(' ')
        .toLowerCase()
      if (haystack.includes(q)) {
        out.push({
          id: device.id,
          icon: Server,
          label: device.name,
          sublabel: `${DEVICE_TYPE_LABELS[device.type]} · ${device.ipv4 || device.hostname || 'Gerät'}`,
          path: `/devices/${device.id}`,
        })
      }
    }

    for (const cred of credentials) {
      if (cred.title.toLowerCase().includes(q) || cred.username.toLowerCase().includes(q)) {
        out.push({
          id: cred.id,
          icon: KeyRound,
          label: cred.title,
          sublabel: cred.username || 'Zugangsdaten',
          path: `/credentials`,
        })
      }
    }

    for (const doc of documents) {
      if (doc.name.toLowerCase().includes(q) || doc.tags.some((t) => t.toLowerCase().includes(q))) {
        out.push({ id: doc.id, icon: FileText, label: doc.name, sublabel: 'Dokument', path: `/documents` })
      }
    }

    for (const note of notes) {
      if (note.title.toLowerCase().includes(q)) {
        out.push({ id: note.id, icon: StickyNote, label: note.title, sublabel: 'Notiz', path: `/notes` })
      }
    }

    return out.slice(0, 10)
  }, [query, sites, devices, credentials, documents, notes])

  const open = focused && query.trim().length >= 2

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Alles durchsuchen…"
        className="pl-8"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Keine Treffer.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={`${r.path}-${r.id}`}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                    )}
                    onClick={() => {
                      navigate(r.path)
                      setQuery('')
                      setFocused(false)
                    }}
                  >
                    <r.icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    <span className="shrink-0 truncate text-xs text-muted-foreground">{r.sublabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
