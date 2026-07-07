import { useState } from 'react'
import { Trash2, Image as ImageIcon, Expand } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { Dropzone } from '@/components/dropzone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fileToDataUrl } from '@/lib/files'
import { toast } from '@/store/toastStore'
import type { SiteImage } from '@/types'

const KIND_LABELS: Record<SiteImage['kind'], string> = {
  floorplan: 'Grundriss',
  photo: 'Foto',
  network: 'Netzwerkplan',
  other: 'Sonstiges',
}

interface SiteImagesSectionProps {
  siteId: string
}

export function SiteImagesSection({ siteId }: SiteImagesSectionProps) {
  const siteImages = useDataStore((s) => s.siteImages)
  const createSiteImage = useDataStore((s) => s.createSiteImage)
  const deleteSiteImage = useDataStore((s) => s.deleteSiteImage)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [preview, setPreview] = useState<SiteImage | undefined>(undefined)
  const [pendingKind, setPendingKind] = useState<SiteImage['kind']>('photo')

  const filtered = siteImages.filter((i) => i.siteId === siteId)

  async function handleUpload(files: File[]) {
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file)
      await createSiteImage({
        siteId,
        name: file.name,
        kind: pendingKind,
        mimeType: file.type,
        size: file.size,
        dataUrl,
      })
    }
    toast({ title: `${files.length} Bild(er) hochgeladen`, variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Bilder & Pläne</h3>
        {canEdit && (
          <Select value={pendingKind} onValueChange={(v) => setPendingKind(v as SiteImage['kind'])}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(KIND_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {canEdit && (
        <Dropzone
          onFiles={handleUpload}
          accept={{ 'image/*': [] }}
          label="Grundrisse, Fotos oder Netzwerkpläne hierher ziehen"
        />
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine Bilder hochgeladen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border">
              <img src={img.dataUrl} alt={img.name} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  {KIND_LABELS[img.kind]}
                </Badge>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 hover:text-white" onClick={() => setPreview(img)}>
                  <Expand className="h-3.5 w-3.5" />
                </Button>
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 hover:text-white" onClick={() => setDeleteId(img.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(undefined)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <img src={preview.dataUrl} alt={preview.name} className="max-h-[75vh] w-full rounded-md object-contain" />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Bild löschen"
        description="Dieses Bild wird unwiderruflich gelöscht."
        onConfirm={() => deleteId && deleteSiteImage(deleteId)}
      />
    </div>
  )
}
