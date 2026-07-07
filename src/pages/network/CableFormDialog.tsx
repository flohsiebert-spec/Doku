import { useEffect, useState, type FormEvent } from 'react'
import { useDataStore } from '@/store/dataStore'
import { toast } from '@/store/toastStore'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PORTED_DEVICE_TYPES, type Cable, type CablePortMode } from '@/types'

const CABLE_TYPES = ['Cat5e', 'Cat6', 'Cat6a', 'Fiber SM', 'Fiber MM', 'Sonstiges']

interface CableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  cable?: Cable
  defaultFromDeviceId?: string
  defaultFromPort?: string
}

const emptyForm = {
  fromDeviceId: '',
  fromPort: '',
  toDeviceId: '',
  toPort: '',
  cableType: 'Cat6',
  length: '',
  color: '',
  vlanId: '',
  portMode: 'access' as CablePortMode,
}

export function CableFormDialog({
  open,
  onOpenChange,
  siteId,
  cable,
  defaultFromDeviceId,
  defaultFromPort,
}: CableFormDialogProps) {
  const createCable = useDataStore((s) => s.createCable)
  const updateCable = useDataStore((s) => s.updateCable)
  const devices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const vlans = useDataStore((s) => s.vlans).filter((v) => v.siteId === siteId)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) {
      setForm(
        cable
          ? {
              fromDeviceId: cable.fromDeviceId,
              fromPort: cable.fromPort,
              toDeviceId: cable.toDeviceId,
              toPort: cable.toPort,
              cableType: cable.cableType,
              length: cable.length,
              color: cable.color,
              vlanId: cable.vlanId,
              portMode: cable.portMode,
            }
          : { ...emptyForm, fromDeviceId: defaultFromDeviceId ?? '', fromPort: defaultFromPort ?? '' },
      )
    }
  }, [open, cable, defaultFromDeviceId, defaultFromPort])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.fromDeviceId || !form.fromPort.trim() || !form.toDeviceId || !form.toPort.trim()) return
    const data = { siteId, ...form }
    if (cable) {
      await updateCable(cable.id, data)
      toast({ title: 'Kabelverbindung aktualisiert', variant: 'success' })
    } else {
      await createCable(data)
      toast({ title: 'Kabelverbindung angelegt', variant: 'success' })
    }
    onOpenChange(false)
  }

  function portOptions(deviceId: string): string[] | null {
    const device = devices.find((d) => d.id === deviceId)
    if (!device || !PORTED_DEVICE_TYPES.includes(device.type)) return null
    return Array.from({ length: device.portCount || 24 }, (_, i) => String(i + 1))
  }

  const fromPortOptions = portOptions(form.fromDeviceId)
  const toPortOptions = portOptions(form.toDeviceId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{cable ? 'Kabelverbindung bearbeiten' : 'Neue Kabelverbindung'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
            <div className="flex flex-col gap-1.5">
              <Label>Von Gerät</Label>
              <Select value={form.fromDeviceId} onValueChange={(v) => setForm({ ...form, fromDeviceId: v, fromPort: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Gerät wählen" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Von Port</Label>
              {fromPortOptions ? (
                <Select value={form.fromPort} onValueChange={(v) => setForm({ ...form, fromPort: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Port" />
                  </SelectTrigger>
                  <SelectContent>
                    {fromPortOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        Port {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.fromPort} onChange={(e) => setForm({ ...form, fromPort: e.target.value })} placeholder="z. B. eth0" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
            <div className="flex flex-col gap-1.5">
              <Label>Zu Gerät</Label>
              <Select value={form.toDeviceId} onValueChange={(v) => setForm({ ...form, toDeviceId: v, toPort: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Gerät wählen" />
                </SelectTrigger>
                <SelectContent>
                  {devices
                    .filter((d) => d.id !== form.fromDeviceId)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Zu Port</Label>
              {toPortOptions ? (
                <Select value={form.toPort} onValueChange={(v) => setForm({ ...form, toPort: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Port" />
                  </SelectTrigger>
                  <SelectContent>
                    {toPortOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        Port {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.toPort} onChange={(e) => setForm({ ...form, toPort: e.target.value })} placeholder="z. B. eth0" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Kabeltyp</Label>
              <Select value={form.cableType} onValueChange={(v) => setForm({ ...form, cableType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CABLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cable-length">Länge</Label>
              <Input id="cable-length" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} placeholder="z. B. 3m" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cable-color">Farbe</Label>
              <Input id="cable-color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="z. B. Blau" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Port-Modus</Label>
              <Select value={form.portMode} onValueChange={(v) => setForm({ ...form, portMode: v as CablePortMode })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="trunk">Trunk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>VLAN (optional)</Label>
            <Select value={form.vlanId || '__none__'} onValueChange={(v) => setForm({ ...form, vlanId: v === '__none__' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Kein VLAN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Kein VLAN</SelectItem>
                {vlans.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.vlanId} · {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit">{cable ? 'Speichern' : 'Anlegen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
