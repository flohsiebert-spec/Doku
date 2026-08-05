import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { MessageSquare, Trash2 } from 'lucide-react'
import type { Ticket } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/empty-state'

interface TicketCommentsProps {
  ticket: Ticket
}

export function TicketComments({ ticket }: TicketCommentsProps) {
  const addTicketComment = useDataStore((s) => s.addTicketComment)
  const removeTicketComment = useDataStore((s) => s.removeTicketComment)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sorted = [...ticket.comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  async function handleSubmit() {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await addTicketComment(ticket.id, message)
      setMessage('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {sorted.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Noch keine Kommentare" />
      ) : (
        <ul className="space-y-3">
          {sorted.map((comment) => (
            <li key={comment.id} className="rounded-md border border-border p-3 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-medium">{comment.author}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive"
                    onClick={async () => {
                      await removeTicketComment(ticket.id, comment.id)
                      toast.success('Kommentar gelöscht.')
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap">{comment.message}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <Textarea
          rows={3}
          placeholder="Kommentar hinzufügen…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" disabled={!message.trim() || submitting} onClick={handleSubmit}>
            Kommentieren
          </Button>
        </div>
      </div>
    </div>
  )
}
