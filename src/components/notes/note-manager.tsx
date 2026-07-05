import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Pencil, Plus, StickyNote, Trash2 } from 'lucide-react'
import type { Note, NoteEntityType } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NoteManagerProps {
  entityType: NoteEntityType
  entityId: string | null
}

export function NoteManager({ entityType, entityId }: NoteManagerProps) {
  const notes = useDataStore((s) => s.notes)
  const createNote = useDataStore((s) => s.createNote)
  const updateNote = useDataStore((s) => s.updateNote)
  const removeNote = useDataStore((s) => s.removeNote)

  const scoped = useMemo(
    () => notes.filter((n) => n.entityType === entityType && n.entityId === entityId),
    [notes, entityType, entityId],
  )

  const [editNote, setEditNote] = useState<Note | null | 'new'>(null)
  const [deleteNote, setDeleteNote] = useState<Note | null>(null)
  const [form, setForm] = useState({ title: '', content: '' })
  const [tab, setTab] = useState('edit')

  function openNew() {
    setForm({ title: '', content: '' })
    setEditNote('new')
    setTab('edit')
  }

  function openEdit(note: Note) {
    setForm({ title: note.title, content: note.content })
    setEditNote(note)
    setTab('edit')
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Bitte einen Titel angeben.')
      return
    }
    if (editNote === 'new') {
      await createNote({ title: form.title, content: form.content, entityType, entityId })
      toast.success('Notiz erstellt.')
    } else if (editNote) {
      await updateNote(editNote.id, form)
      toast.success('Notiz aktualisiert.')
    }
    setEditNote(null)
  }

  const sorted = [...scoped].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus /> Notiz hinzufügen
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={StickyNote} title="Noch keine Notizen" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((note) => (
            <Card key={note.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>{note.title}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(note)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => setDeleteNote(note)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="markdown-body max-h-40 overflow-y-auto text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content || '*Leer*'}</ReactMarkdown>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Zuletzt geändert: {format(new Date(note.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editNote} onOpenChange={(o) => !o && setEditNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editNote === 'new' ? 'Neue Notiz' : 'Notiz bearbeiten'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Titel</Label>
              <Input
                id="note-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="edit">Bearbeiten</TabsTrigger>
                <TabsTrigger value="preview">Vorschau</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  rows={10}
                  placeholder="Markdown wird unterstützt…"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="markdown-body min-h-40 rounded-md border border-border p-3 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || '*Leer*'}</ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNote(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteNote}
        onOpenChange={(o) => !o && setDeleteNote(null)}
        title="Notiz löschen"
        description={`Möchten Sie "${deleteNote?.title}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteNote) {
            await removeNote(deleteNote.id)
            toast.success('Notiz gelöscht.')
          }
          setDeleteNote(null)
        }}
      />
    </div>
  )
}
