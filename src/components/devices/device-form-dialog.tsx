import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Device, DeviceType } from '@/types'
import { DEVICE_TYPES, DEVICE_TYPE_LABELS } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DeviceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device
  defaultSiteId?: string
  defaultRoomId?: string | null
}

const EMPTY = {
  siteId: '',
  roomId: '' as string,
  type: 'other' as DeviceType,
  name: '',
  hostname: '',
  ipv4: '',
  ipv6: '',
  subnet: '',
  gateway: '',
  mac: '',
  serialNumber: '',
  model: '',
  manufacturer: '',
  rackPosition: '',
  osFirmware: '',
  purchaseDate: '',
  warrantyUntil: '',
  supplier: '',
  notes: '',
}

export function DeviceFormDialog({
  open,
  onOpenChange,
  device,
  defaultSiteId,
  defaultRoomId,
}: DeviceFormDialogProps) {
  const sites = useDataStore((s) => s.sites)
  const rooms = useDataStore((s) => s.rooms)
  const createDevice = useDataStore((s) => s.createDevice)
  const updateDevice = useDataStore((s) => s.updateDevice)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        device
          ? { ...device, roomId: device.roomId ?? '' }
          : { ...EMPTY, siteId: defaultSiteId ?? sites[0]?.id ?? '', roomId: defaultRoomId ?? '' },
      )
    }
  }, [open, device, defaultSiteId, defaultRoomId, sites])

  const availableRooms = rooms.filter((r) => r.siteId === form.siteId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.siteId) {
      toast.error('Bitte einen Standort auswählen.')
      return
    }
    setSubmitting(true)
    try {
      const payload = { ...form, roomId: form.roomId || null }
      if (device) {
        await updateDevice(device.id, payload)
        toast.success('Gerät aktualisiert.')
      } else {
        await createDevice(payload)
        toast.success('Gerät angelegt.')
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{device ? 'Gerät bearbeiten' : 'Neues Gerät'}</DialogTitle>
          <DialogDescription>Netzwerk- und Hardware-Details des Geräts.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gerätetyp</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as DeviceType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DEVICE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-name">Name / Hostname</Label>
              <Input
                id="device-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Standort</Label>
              <Select
                value={form.siteId}
                onValueChange={(v) => setForm({ ...form, siteId: v, roomId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Standort wählen" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Raum / Bereich</Label>
              <Select
                value={form.roomId || '__none'}
                onValueChange={(v) => setForm({ ...form, roomId: v === '__none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kein Raum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Kein Raum</SelectItem>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="device-ipv4">IPv4</Label>
              <Input
                id="device-ipv4"
                value={form.ipv4}
                onChange={(e) => setForm({ ...form, ipv4: e.target.value })}
                placeholder="192.168.1.10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-ipv6">IPv6</Label>
              <Input
                id="device-ipv6"
                value={form.ipv6}
                onChange={(e) => setForm({ ...form, ipv6: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-subnet">Subnetz</Label>
              <Input
                id="device-subnet"
                value={form.subnet}
                onChange={(e) => setForm({ ...form, subnet: e.target.value })}
                placeholder="255.255.255.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-gateway">Gateway</Label>
              <Input
                id="device-gateway"
                value={form.gateway}
                onChange={(e) => setForm({ ...form, gateway: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="device-mac">MAC-Adresse</Label>
              <Input
                id="device-mac"
                value={form.mac}
                onChange={(e) => setForm({ ...form, mac: e.target.value })}
                placeholder="00:1A:2B:3C:4D:5E"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-rack">Rack-Position</Label>
              <Input
                id="device-rack"
                value={form.rackPosition}
                onChange={(e) => setForm({ ...form, rackPosition: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="device-manufacturer">Hersteller</Label>
              <Input
                id="device-manufacturer"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-model">Modell</Label>
              <Input
                id="device-model"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="device-serial">Seriennummer</Label>
              <Input
                id="device-serial"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-os">Betriebssystem / Firmware</Label>
              <Input
                id="device-os"
                value={form.osFirmware}
                onChange={(e) => setForm({ ...form, osFirmware: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="device-purchase">Kaufdatum</Label>
              <Input
                id="device-purchase"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-warranty">Garantie bis</Label>
              <Input
                id="device-warranty"
                type="date"
                value={form.warrantyUntil}
                onChange={(e) => setForm({ ...form, warrantyUntil: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device-supplier">Lieferant</Label>
              <Input
                id="device-supplier"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="device-notes">Beschreibung / Notizen</Label>
            <Textarea
              id="device-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {device ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
