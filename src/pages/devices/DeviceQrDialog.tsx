import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { downloadBlob } from '@/lib/utils'
import { dataUrlToBlob } from '@/lib/files'
import { buildDeviceQrPayload } from '@/lib/qr'
import type { Device } from '@/types'

interface DeviceQrDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device
}

export function DeviceQrDialog({ open, onOpenChange, device }: DeviceQrDialogProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  const label = [device.name, device.ipv4, device.serialNumber].filter(Boolean).join('\n')

  useEffect(() => {
    if (!open) return
    QRCode.toDataURL(buildDeviceQrPayload(device), { width: 320, margin: 1 }).then(setDataUrl)
  }, [open, device])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR-Code Geräteetikett</DialogTitle>
          <DialogDescription>Enthält Name, IP-Adresse und Seriennummer.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {dataUrl && <img src={dataUrl} alt={`QR-Code für ${device.name}`} className="rounded-md border border-border" />}
          <pre className="whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-center font-mono text-xs">{label}</pre>
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={!dataUrl}
            onClick={() => dataUrl && downloadBlob(dataUrlToBlob(dataUrl), `${device.name || 'geraet'}-qrcode.png`)}
          >
            <Download className="h-4 w-4" /> Als PNG herunterladen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
