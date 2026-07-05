import { Link } from 'react-router-dom'
import { useDataStore } from '@/store/useDataStore'
import { DocumentManager } from '@/components/documents/document-manager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DocumentsPage() {
  const documents = useDataStore((s) => s.documents)
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)

  const scopedDocs = documents.filter((d) => d.entityType !== 'global')

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Dokumente</h1>
        <p className="text-sm text-muted-foreground">
          Globale Dokumente sowie Übersicht aller Standort-/Gerätedokumente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Globale Dokumente</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentManager entityType="global" entityId={null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alle Standort- &amp; Gerätedokumente</CardTitle>
        </CardHeader>
        <CardContent>
          {scopedDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Dokumente vorhanden.</p>
          ) : (
            <ul className="divide-y divide-border">
              {scopedDocs.map((doc) => {
                const site = sites.find((s) => s.id === doc.entityId)
                const device = devices.find((d) => d.id === doc.entityId)
                const target = device
                  ? { label: `Gerät: ${device.name}`, to: `/devices/${device.id}` }
                  : site
                    ? { label: `Standort: ${site.name}`, to: `/sites/${site.id}` }
                    : null
                return (
                  <li key={doc.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate">{doc.name}</span>
                    <div className="flex items-center gap-2">
                      {doc.isImage && <Badge variant="outline">Bild</Badge>}
                      {target && (
                        <Link to={target.to} className="text-primary hover:underline">
                          {target.label}
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
