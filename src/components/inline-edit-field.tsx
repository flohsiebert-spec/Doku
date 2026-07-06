import { useEffect, useState, type KeyboardEvent } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface InlineEditFieldProps {
  label: string
  value: string
  onSave: (value: string) => void
  type?: 'text' | 'date' | 'textarea'
  mono?: boolean
  placeholder?: string
}

export function InlineEditField({ label, value, onSave, type = 'text', mono, placeholder }: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-start gap-1.5">
          {type === 'textarea' ? (
            <Textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn('text-sm', mono && 'font-mono')}
            />
          ) : (
            <Input
              autoFocus
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn('text-sm', mono && 'font-mono')}
            />
          )}
          <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={commit} title="Speichern">
            <Check className="h-4 w-4 text-success" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={cancel} title="Abbrechen">
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="-m-1 flex flex-col gap-0.5 rounded-md p-1 text-left hover:bg-accent"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('whitespace-pre-wrap text-sm', mono && 'font-mono', !value && 'italic text-muted-foreground/60')}>
        {value || placeholder || 'Klicken zum Bearbeiten'}
      </span>
    </button>
  )
}
