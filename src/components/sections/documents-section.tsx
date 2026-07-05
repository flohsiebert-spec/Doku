import { useRef, useState } from 'react'
import { Download, Eye, FileText, History, Tags, Trash2, Upload } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Dropzone } from '@/components/dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DocumentPreviewDialog } from '@/components/document-preview-dialog'
import { fileToDataUrl, dataUrlToBlob } from '@/lib/files'
import { formatBytes, formatDateTime, downloadBlob } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import type { Doc } from '@/types'

interface DocumentsSectionProps {
  siteId?: string
  deviceId?: string
  global?: boolean
}

export function DocumentsSection({ siteId, deviceId, global }: DocumentsSectionProps) {
  const documents = useDataStore((s) => s.documents)
  const createDocument = useDataStore((s) => s.createDocument)
  const updateDocument = useDataStore((s) => s.updateDocument)
  const deleteDocument = useDataStore((s) => s.deleteDocument)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<Doc | undefined>(undefined)
  const versionInputRef = useRef<HTMLInputElement | null>(null)
  const [versionTargetId, setVersionTargetId] = useState<string | null>(null)

  const filtered = global
    ? documents.filter((d) => !d.siteId && !d.deviceId)
    : deviceId
      ? documents.filter((d) => d.deviceId === deviceId)
      : documents.filter((d) => d.siteId === siteId && !d.deviceId)

  async function handleUpload(files: File[]) {
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file)
      await createDocument({
        name: file.name,
        tags: [],
        siteId: siteId ?? '',
        deviceId: deviceId ?? '',
        versions: [
          {
            version: 1,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl,
            uploadedAt: new Date().toISOString(),
          },
        ],
      })
    }
    toast({ title: `${files.length} Datei(en) hochgeladen`, variant: 'success' })
  }

  async function handleNewVersion(doc: Doc, file: File) {
    const dataUrl = await fileToDataUrl(file)
    const nextVersion = doc.versions.length + 1
    await updateDocument(doc.id, {
      versions: [
        ...doc.versions,
        {
          version: nextVersion,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        },
      ],
    })
    toast({ title: `Version ${nextVersion} hochgeladen`, variant: 'success' })
  }

  function updateTags(doc: Doc, tagsStr: string) {
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    updateDocument(doc.id, { tags })
  }

  function download(doc: Doc) {
    const latest = doc.versions[doc.versions.length - 1]
    downloadBlob(dataUrlToBlob(latest.dataUrl), doc.name)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Dokumente</h3>
      </div>
      <Dropzone onFiles={handleUpload} label="PDFs, Bilder, Netzwerkpläne oder Konfigdateien hochladen" />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine Dokumente.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((doc) => {
            const latest = doc.versions[doc.versions.length - 1]
            return (
              <div key={doc.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{doc.name}</span>
                    <Badge variant="outline">v{latest.version}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(latest.size)} · {formatDateTime(latest.uploadedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(doc)} title="Vorschau">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => download(doc)} title="Herunterladen">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Neue Version hochladen"
                      onClick={() => {
                        setVersionTargetId(doc.id)
                        versionInputRef.current?.click()
                      }}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(doc.id)} title="Löschen">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tags className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    defaultValue={doc.tags.join(', ')}
                    placeholder="Tags, mit Komma getrennt"
                    className="h-7 text-xs"
                    onBlur={(e) => updateTags(doc, e.target.value)}
                  />
                </div>
                {doc.versions.length > 1 && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="flex cursor-pointer items-center gap-1">
                      <History className="h-3 w-3" /> {doc.versions.length} Versionen (Archiv)
                    </summary>
                    <div className="mt-1 flex flex-col gap-1 pl-4">
                      {doc.versions
                        .slice()
                        .reverse()
                        .map((v) => (
                          <div key={v.version} className="flex items-center justify-between">
                            <span>
                              v{v.version} · {formatBytes(v.size)} · {formatDateTime(v.uploadedAt)}
                            </span>
                            <button
                              className="text-primary hover:underline"
                              onClick={() => setPreviewDoc({ ...doc, versions: [v] })}
                            >
                              Ansehen
                            </button>
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      )}

      <input
        ref={versionInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const doc = filtered.find((d) => d.id === versionTargetId)
          if (file && doc) handleNewVersion(doc, file)
          e.target.value = ''
        }}
      />

      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(undefined)}
        document={previewDoc}
      />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Dokument löschen"
        description="Das Dokument und alle Versionen werden unwiderruflich gelöscht."
        onConfirm={() => deleteId && deleteDocument(deleteId)}
      />
    </div>
  )
}
