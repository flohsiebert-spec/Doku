import { useEffect, useState, type FormEvent } from 'react'
import { useDataStore } from '@/store/dataStore'
import { toast } from '@/store/toastStore'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEVICE_TYPES, PATCH_PANEL_SIZES, PORTED_DEVICE_TYPES, type Device, type DeviceType } from '@/types'

interface DeviceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device
  defaultSiteId?: string
  defaultRoomId?: string
}

const emptyForm = {
  name: '',
  hostname: '',
  type: 'server' as DeviceType,
  ipv4: '',
  ipv6: '',
  subnet: '',
  gateway: '',
  mac: '',
  serialNumber: '',
  model: '',
  manufacturer: '',
  siteId: '',
  roomId: '',
  rackPosition: '',
  os: '',
  firmwareVersion: '',
  purchaseDate: '',
  warrantyUntil: '',
  supplier: '',
  notes: '',
  portCount: 24,
}

export function DeviceFormDialog({ open, onOpenChange, device, defaultSiteId, defaultRoomId }: DeviceFormDialogProps) {
  const createDevice = useDataStore((s) => s.createDevice)
  const updateDevice = useDataStore((s) => s.updateDevice)
  const sites = useDataStore((s) => s.sites)
  const rooms = useDataStore((s) => s.rooms)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) {
      setForm(
        device
          ? {
              name: device.name,
              hostname: device.hostname,
              type: device.type,
              ipv4: device.ipv4,
              ipv6: device.ipv6,
              subnet: device.subnet,
              gateway: device.gateway,
              mac: device.mac,
              serialNumber: device.serialNumber,
              model: device.model,
              manufacturer: device.manufacturer,
              siteId: device.siteId,
              roomId: device.roomId,
              rackPosition: device.rackPosition,
              os: device.os,
              firmwareVersion: device.firmwareVersion,
              purchaseDate: device.purchaseDate,
              warrantyUntil: device.warrantyUntil,
              supplier: device.supplier,
              notes: device.notes,
              portCount: device.portCount || 24,
            }
          : { ...emptyForm, siteId: defaultSiteId ?? '', roomId: defaultRoomId ?? '' },
      )
    }
  }, [open, device, defaultSiteId, defaultRoomId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.siteId) return
    const data = {
      ...form,
      rackId: device?.rackId ?? '',
      rackUnit: device?.rackUnit ?? null,
      heSize: device?.heSize ?? 1,
    }
    if (device) {
      await updateDevice(device.id, data)
      toast({ title: 'Gerät aktualisiert', variant: 'success' })
    } else {
      await createDevice(data)
      toast({ title: 'Gerät angelegt', variant: 'success' })
    }
    onOpenChange(false)
  }

  const roomsForSite = rooms.filter((r) => r.siteId === form.siteId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{device ? 'Gerät bearbeiten' : 'Neues Gerät'}</DialogTitle>
          <DialogDescription>Erfasse alle relevanten Netzwerk- und Inventardaten.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-name">Name</Label>
            <Input id="dev-name" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-hostname">Hostname</Label>
            <Input id="dev-hostname" value={form.hostname} onChange={(e) => setForm({ ...form, hostname: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Gerätetyp</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as DeviceType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Standort</Label>
            <Select value={form.siteId} onValueChange={(v) => setForm({ ...form, siteId: v, roomId: '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Standort wählen" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Raum / Bereich</Label>
            <Select value={form.roomId || '__none__'} onValueChange={(v) => setForm({ ...form, roomId: v === '__none__' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Kein Raum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Kein Raum</SelectItem>
                {roomsForSite.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-rack">Rack-Position (Notiz)</Label>
            <Input id="dev-rack" value={form.rackPosition} onChange={(e) => setForm({ ...form, rackPosition: e.target.value })} />
          </div>

          {PORTED_DEVICE_TYPES.includes(form.type) && (
            <div className="flex flex-col gap-1.5">
              <Label>Anzahl Ports</Label>
              {form.type === 'patch-panel' ? (
                <Select value={String(form.portCount)} onValueChange={(v) => setForm({ ...form, portCount: Number(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATCH_PANEL_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} Ports
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  min={1}
                  max={128}
                  value={form.portCount}
                  onChange={(e) => setForm({ ...form, portCount: Number(e.target.value) })}
                />
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-ipv4">IPv4-Adresse</Label>
            <Input id="dev-ipv4" value={form.ipv4} onChange={(e) => setForm({ ...form, ipv4: e.target.value })} placeholder="192.168.1.10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-ipv6">IPv6-Adresse</Label>
            <Input id="dev-ipv6" value={form.ipv6} onChange={(e) => setForm({ ...form, ipv6: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-subnet">Subnetz</Label>
            <Input id="dev-subnet" value={form.subnet} onChange={(e) => setForm({ ...form, subnet: e.target.value })} placeholder="192.168.1.0/24" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-gateway">Gateway</Label>
            <Input id="dev-gateway" value={form.gateway} onChange={(e) => setForm({ ...form, gateway: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-mac">MAC-Adresse</Label>
            <Input id="dev-mac" value={form.mac} onChange={(e) => setForm({ ...form, mac: e.target.value })} placeholder="AA:BB:CC:DD:EE:FF" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-serial">Seriennummer</Label>
            <Input id="dev-serial" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-manufacturer">Hersteller</Label>
            <Input id="dev-manufacturer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-model">Modell</Label>
            <Input id="dev-model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-os">Betriebssystem / Firmware</Label>
            <Input id="dev-os" value={form.os} onChange={(e) => setForm({ ...form, os: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-firmware">Firmware-Version</Label>
            <Input id="dev-firmware" value={form.firmwareVersion} onChange={(e) => setForm({ ...form, firmwareVersion: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-purchase">Kaufdatum</Label>
            <Input id="dev-purchase" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-warranty">Garantie bis</Label>
            <Input id="dev-warranty" type="date" value={form.warrantyUntil} onChange={(e) => setForm({ ...form, warrantyUntil: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="dev-supplier">Lieferant</Label>
            <Input id="dev-supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="dev-notes">Beschreibung / Notizen</Label>
            <Textarea id="dev-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="submit">{device ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
