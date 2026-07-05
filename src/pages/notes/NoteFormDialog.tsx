import { useEffect, useState, type FormEvent } from 'react'
import { useDataStore } from '@/store/dataStore'
import { toast } from '@/store/toastStore'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/markdown-editor'
import type { Note } from '@/types'

interface NoteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note
  siteId?: string
  deviceId?: string
}

export function NoteFormDialog({ open, onOpenChange, note, siteId, deviceId }: NoteFormDialogProps) {
  const createNote = useDataStore((s) => s.createNote)
  const updateNote = useDataStore((s) => s.updateNote)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? '')
      setContent(note?.content ?? '')
    }
  }, [open, note])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (note) {
      await updateNote(note.id, { title, content })
      toast({ title: 'Notiz aktualisiert', variant: 'success' })
    } else {
      await createNote({ title, content, siteId: siteId ?? '', deviceId: deviceId ?? '' })
      toast({ title: 'Notiz erstellt', variant: 'success' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{note ? 'Notiz bearbeiten' : 'Neue Notiz'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note-title">Titel</Label>
            <Input id="note-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Inhalt</Label>
            <MarkdownEditor value={content} onChange={setContent} />
          </div>
          <DialogFooter>
            <Button type="submit">{note ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
