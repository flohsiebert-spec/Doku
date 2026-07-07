import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildDeviceQrPayload } from '@/lib/qr'
import type { Device } from '@/types'

interface QrLabelSheetProps {
  devices: Device[]
  siteName: string
  onClose: () => void
}

export function QrLabelSheet({ devices, siteName, onClose }: QrLabelSheetProps) {
  const [codes, setCodes] = useState<Record<string, string>>({})

  useEffect(() => {
    document.body.classList.add('qr-print-mode')
    return () => document.body.classList.remove('qr-print-mode')
  }, [])

  useEffect(() => {
    let cancelled = false
    async function generate() {
      const entries = await Promise.all(
        devices.map(async (d) => {
          const dataUrl = await QRCode.toDataURL(buildDeviceQrPayload(d, siteName), { width: 160, margin: 0 })
          return [d.id, dataUrl] as const
        }),
      )
      if (!cancelled) setCodes(Object.fromEntries(entries))
    }
    generate()
    return () => {
      cancelled = true
    }
  }, [devices, siteName])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">{devices.length} Etiketten · A4, 4×7-Raster</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Drucken
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="h-4 w-4" /> Schließen
          </Button>
        </div>
      </div>
      <div id="qr-print-area" className="mx-auto grid max-w-[210mm] grid-cols-4 gap-2 p-[8mm]">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex flex-col items-center justify-center gap-1 border border-dashed border-border p-1 text-center"
            style={{ width: '46mm', height: '38mm' }}
          >
            {codes[device.id] && <img src={codes[device.id]} alt={device.name} className="h-16 w-16" />}
            <div className="text-[7pt] leading-tight">
              <div className="font-semibold">{device.name}</div>
              {device.ipv4 && <div>{device.ipv4}</div>}
              {device.serialNumber && <div>{device.serialNumber}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
