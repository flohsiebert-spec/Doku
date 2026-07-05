import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { NotebookText } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function NoteList() {
  const notes = useDataStore((s) => s.notes)
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)

  const sorted = notes
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Notizen</h1>
        <p className="text-sm text-muted-foreground">
          Alle Markdown-Notizen aus Standorten und Geräten.
        </p>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <NotebookText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Noch keine Notizen. Lege sie direkt bei einem Standort oder Gerät an.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((note) => {
            const device = devices.find((d) => d.id === note.deviceId)
            const site = sites.find((s) => s.id === note.siteId)
            const path = device ? `/devices/${device.id}` : site ? `/sites/${site.id}` : '#'
            return (
              <Link key={note.id} to={path}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{note.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(note.updatedAt)}</span>
                    </div>
                    {(device || site) && (
                      <Badge variant="secondary" className="w-fit">
                        {device?.name ?? site?.name}
                      </Badge>
                    )}
                    <div className="prose prose-sm dark:prose-invert line-clamp-3 max-w-none text-sm text-muted-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
