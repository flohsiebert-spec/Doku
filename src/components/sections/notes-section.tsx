import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { NotebookText, Plus, Pencil, Trash2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { NoteFormDialog } from '@/pages/notes/NoteFormDialog'
import { formatDateTime } from '@/lib/utils'
import type { Note } from '@/types'

interface NotesSectionProps {
  siteId?: string
  deviceId?: string
}

export function NotesSection({ siteId, deviceId }: NotesSectionProps) {
  const notes = useDataStore((s) => s.notes)
  const deleteNote = useDataStore((s) => s.deleteNote)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Note | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = deviceId
    ? notes.filter((n) => n.deviceId === deviceId)
    : notes.filter((n) => n.siteId === siteId && !n.deviceId)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notizen</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> Neue Notiz
        </Button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <NotebookText className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine Notizen.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered
            .slice()
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((note) => (
              <div key={note.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{note.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDateTime(note.updatedAt)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(note)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(note.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                </div>
              </div>
            ))}
        </div>
      )}
      <NoteFormDialog open={formOpen} onOpenChange={setFormOpen} note={editing} siteId={siteId} deviceId={deviceId} />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Notiz löschen"
        description="Diese Notiz wird unwiderruflich gelöscht."
        onConfirm={() => deleteId && deleteNote(deleteId)}
      />
    </div>
  )
}
