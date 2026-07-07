import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isImage, isPdf } from '@/lib/files'
import { documentBlobsRepo } from '@/db/repository'
import { blobKey, type Doc, type DocumentVersion } from '@/types'

interface DocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: Doc
  version?: DocumentVersion
}

export function DocumentPreviewDialog({ open, onOpenChange, document, version }: DocumentPreviewDialogProps) {
  const v = version ?? document?.versions[document.versions.length - 1]
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !document || !v) {
      setDataUrl(null)
      return
    }
    let cancelled = false
    documentBlobsRepo.get(blobKey(document.id, v.version)).then((url) => {
      if (!cancelled) setDataUrl(url ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [open, document, v])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{document?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-md bg-muted">
          {!dataUrl && (
            <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Lädt…
            </div>
          )}
          {dataUrl && v && isImage(v.mimeType) && (
            <img src={dataUrl} alt={document?.name} className="max-h-[70vh] max-w-full object-contain" />
          )}
          {dataUrl && v && isPdf(v.mimeType) && (
            <iframe title={document?.name} src={dataUrl} className="h-[70vh] w-full" />
          )}
          {dataUrl && v && !isImage(v.mimeType) && !isPdf(v.mimeType) && (
            <p className="p-8 text-sm text-muted-foreground">
              Keine Vorschau verfügbar für diesen Dateityp. Bitte herunterladen.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
