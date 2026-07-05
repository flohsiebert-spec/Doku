import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isImage, isPdf } from '@/lib/files'
import type { Doc, DocumentVersion } from '@/types'

interface DocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: Doc
  version?: DocumentVersion
}

export function DocumentPreviewDialog({ open, onOpenChange, document, version }: DocumentPreviewDialogProps) {
  const v = version ?? document?.versions[document.versions.length - 1]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{document?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-md bg-muted">
          {v && isImage(v.mimeType) && (
            <img src={v.dataUrl} alt={document?.name} className="max-h-[70vh] max-w-full object-contain" />
          )}
          {v && isPdf(v.mimeType) && (
            <iframe title={document?.name} src={v.dataUrl} className="h-[70vh] w-full" />
          )}
          {v && !isImage(v.mimeType) && !isPdf(v.mimeType) && (
            <p className="p-8 text-sm text-muted-foreground">
              Keine Vorschau verfügbar für diesen Dateityp. Bitte herunterladen.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
