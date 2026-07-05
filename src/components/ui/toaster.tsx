import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg',
            t.variant === 'destructive' && 'border-destructive/50 bg-destructive/10',
            t.variant === 'success' && 'border-success/50 bg-success/10',
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
