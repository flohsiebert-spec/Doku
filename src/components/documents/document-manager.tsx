import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Eye,
  FileText,
  History,
  Image as ImageIcon,
  Tag,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import type { DocumentEntityType, DocumentRecord } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { formatBytes } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DocumentManagerProps {
  entityType: DocumentEntityType
  entityId: string | null
  imagesOnly?: boolean
  title?: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function DocumentManager({ entityType, entityId, imagesOnly = false, title }: DocumentManagerProps) {
  const documents = useDataStore((s) => s.documents)
  const createDocument = useDataStore((s) => s.createDocument)
  const addDocumentVersion = useDataStore((s) => s.addDocumentVersion)
  const removeDocument = useDataStore((s) => s.removeDocument)

  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null)
  const [historyDoc, setHistoryDoc] = useState<DocumentRecord | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<DocumentRecord | null>(null)
  const [tagFilter, setTagFilter] = useState('')

  const scoped = useMemo(
    () =>
      documents.filter(
        (d) => d.entityType === entityType && d.entityId === entityId && (!imagesOnly || d.isImage),
      ),
    [documents, entityType, entityId, imagesOnly],
  )

  const filtered = useMemo(() => {
    const q = tagFilter.trim().toLowerCase()
    if (!q) return scoped
    return scoped.filter((d) => d.tags.some((t) => t.toLowerCase().includes(q)))
  }, [scoped, tagFilter])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          const data = await fileToBase64(file)
          await createDocument({
            name: file.name,
            entityType,
            entityId,
            tags: [],
            isImage: file.type.startsWith('image/'),
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            data,
          })
        } catch {
          toast.error(`Fehler beim Hochladen von "${file.name}".`)
        }
      }
      toast.success(`${acceptedFiles.length} Datei(en) hochgeladen.`)
    },
    [createDocument, entityType, entityId],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: imagesOnly ? { 'image/*': [] } : undefined,
  })

  async function handleNewVersion(doc: DocumentRecord, file: File) {
    const data = await fileToBase64(file)
    await addDocumentVersion(doc.id, {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      data,
    })
    toast.success('Neue Version hochgeladen.')
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive ? 'border-primary bg-accent/50' : 'border-border hover:bg-accent/20'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {title ?? (imagesOnly ? 'Bilder' : 'Dateien')} hierher ziehen oder klicken zum Hochladen
        </p>
      </div>

      {scoped.length > 0 && (
        <div className="relative max-w-xs">
          <Tag className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nach Tag filtern…"
            className="h-8 pl-8 text-sm"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={imagesOnly ? ImageIcon : FileText} title="Keine Dateien vorhanden" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((doc) => {
            const latest = doc.versions[doc.versions.length - 1]
            return (
              <div
                key={doc.id}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-border"
              >
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="flex aspect-video items-center justify-center bg-muted"
                >
                  {doc.isImage ? (
                    <img src={latest.data} alt={doc.name} className="size-full object-cover" />
                  ) : (
                    <FileText className="size-8 text-muted-foreground" />
                  )}
                </button>
                <div className="flex flex-col gap-1 p-2">
                  <p className="truncate text-xs font-medium" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(latest.size)} · v{latest.versionNumber}
                  </p>
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="px-1 py-0 text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-border p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setPreviewDoc(doc)}
                    title="Vorschau"
                  >
                    <Eye className="size-3.5" />
                  </Button>
                  <label
                    className="flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-accent"
                    title="Neue Version hochladen"
                  >
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleNewVersion(doc, file)
                        e.target.value = ''
                      }}
                    />
                    <UploadCloud className="size-3.5" />
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setHistoryDoc(doc)}
                    title="Versionen"
                  >
                    <History className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive"
                    onClick={() => setDeleteDoc(doc)}
                    title="Löschen"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="flex max-h-[70vh] items-center justify-center overflow-auto">
              {previewDoc.isImage ? (
                <img
                  src={previewDoc.versions[previewDoc.versions.length - 1].data}
                  alt={previewDoc.name}
                  className="max-h-[65vh] max-w-full object-contain"
                />
              ) : previewDoc.versions[previewDoc.versions.length - 1].mimeType === 'application/pdf' ? (
                <iframe
                  title={previewDoc.name}
                  src={previewDoc.versions[previewDoc.versions.length - 1].data}
                  className="h-[65vh] w-full rounded border border-border"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-10">
                  <FileText className="size-10 text-muted-foreground" />
                  <a
                    href={previewDoc.versions[previewDoc.versions.length - 1].data}
                    download={previewDoc.versions[previewDoc.versions.length - 1].fileName}
                    className="text-sm text-primary underline"
                  >
                    Datei herunterladen
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyDoc} onOpenChange={(o) => !o && setHistoryDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Versionshistorie · {historyDoc?.name}</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {historyDoc?.versions
              .slice()
              .reverse()
              .map((v) => (
                <li
                  key={v.versionNumber}
                  className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                >
                  <div>
                    <p className="font-medium">Version {v.versionNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(v.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })} ·{' '}
                      {formatBytes(v.size)}
                    </p>
                  </div>
                  <a href={v.data} download={v.fileName} className="text-primary underline">
                    Herunterladen
                  </a>
                </li>
              ))}
          </ul>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteDoc}
        onOpenChange={(o) => !o && setDeleteDoc(null)}
        title="Dokument löschen"
        description={`Möchten Sie "${deleteDoc?.name}" inklusive aller Versionen löschen?`}
        onConfirm={async () => {
          if (deleteDoc) {
            await removeDocument(deleteDoc.id)
            toast.success('Dokument gelöscht.')
          }
          setDeleteDoc(null)
        }}
      />
    </div>
  )
}
