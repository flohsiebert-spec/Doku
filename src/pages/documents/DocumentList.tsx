import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentsSection } from '@/components/sections/documents-section'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function DocumentList() {
  const documents = useDataStore((s) => s.documents)
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return documents
    return documents.filter(
      (d) => d.name.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [documents, search])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dokumente</h1>
        <p className="text-sm text-muted-foreground">Alle Dokumente über Standorte und Geräte hinweg.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Nach Name oder Tag suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search.trim() ? (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Keine Dokumente gefunden.</p>
          )}
          {filtered.map((doc) => {
            const site = sites.find((s) => s.id === doc.siteId)
            const device = devices.find((d) => d.id === doc.deviceId)
            const latest = doc.versions[doc.versions.length - 1]
            return (
              <Link
                key={doc.id}
                to={device ? `/devices/${device.id}` : site ? `/sites/${site.id}` : '/documents'}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{doc.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {device?.name ?? site?.name ?? 'Global'} · {formatDateTime(latest.uploadedAt)}
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <Tabs defaultValue="global">
          <TabsList>
            <TabsTrigger value="global">Global</TabsTrigger>
          </TabsList>
          <TabsContent value="global">
            <DocumentsSection global />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
