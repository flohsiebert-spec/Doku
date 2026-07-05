import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useDataStore } from '@/store/useDataStore'
import { NoteManager } from '@/components/notes/note-manager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NotesPage() {
  const notes = useDataStore((s) => s.notes)
  const sites = useDataStore((s) => s.sites)
  const devices = useDataStore((s) => s.devices)

  const scopedNotes = notes
    .filter((n) => n.entityType !== 'global')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Notizen</h1>
        <p className="text-sm text-muted-foreground">
          Globale Notizen sowie Übersicht aller Standort-/Gerätenotizen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Globale Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <NoteManager entityType="global" entityId={null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alle Standort- &amp; Gerätenotizen</CardTitle>
        </CardHeader>
        <CardContent>
          {scopedNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Notizen vorhanden.</p>
          ) : (
            <ul className="divide-y divide-border">
              {scopedNotes.map((note) => {
                const site = sites.find((s) => s.id === note.entityId)
                const device = devices.find((d) => d.id === note.entityId)
                const target = device
                  ? { label: `Gerät: ${device.name}`, to: `/devices/${device.id}` }
                  : site
                    ? { label: `Standort: ${site.name}`, to: `/sites/${site.id}` }
                    : null
                return (
                  <li key={note.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{note.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                    {target && (
                      <Link to={target.to} className="shrink-0 text-primary hover:underline">
                        {target.label}
                      </Link>
                    )}
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
