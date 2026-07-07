import { useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { toPng } from 'html-to-image'
import { Plus, Server, Pencil, Trash2, Download, X } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { canPlaceDevice, unitsFor } from '@/lib/rack'
import { cn, downloadBlob } from '@/lib/utils'
import { dataUrlToBlob } from '@/lib/files'
import { DeviceIcon, DEVICE_RACK_COLORS } from '@/lib/device-icons'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { RackFormDialog } from '@/pages/network/RackFormDialog'
import { toast } from '@/store/toastStore'
import type { Device, Rack } from '@/types'

interface RacksSectionProps {
  siteId: string
}

function RackVisual({ rack, devices, canEdit }: { rack: Rack; devices: Device[]; canEdit: boolean }) {
  const updateDevice = useDataStore((s) => s.updateDevice)
  const rackRef = useRef<HTMLDivElement | null>(null)
  const [dragOverUnit, setDragOverUnit] = useState<number | null>(null)

  const inRack = devices.filter((d) => d.rackId === rack.id && d.rackUnit !== null)
  const unassigned = devices.filter((d) => d.rackId !== rack.id || d.rackUnit === null)

  function handleDrop(e: DragEvent, startUnit: number) {
    e.preventDefault()
    setDragOverUnit(null)
    const deviceId = e.dataTransfer.getData('text/plain')
    const device = devices.find((d) => d.id === deviceId)
    if (!device) return
    const candidate = { ...device, rackId: rack.id, rackUnit: startUnit }
    if (!canPlaceDevice(candidate, startUnit, rack.heightU, inRack)) {
      toast({ title: 'Passt hier nicht hin', description: 'Belegte Einheiten oder außerhalb des Racks.', variant: 'destructive' })
      return
    }
    updateDevice(device.id, { rackId: rack.id, rackUnit: startUnit })
  }

  function unassign(device: Device) {
    updateDevice(device.id, { rackId: '', rackUnit: null })
  }

  function setHeSize(device: Device, heSize: number) {
    updateDevice(device.id, { heSize })
  }

  async function exportPng() {
    if (!rackRef.current) return
    const dataUrl = await toPng(rackRef.current, { backgroundColor: '#000000' })
    downloadBlob(dataUrlToBlob(dataUrl), `${rack.name}.png`)
  }

  const occupiedUnits = new Map<number, Device>()
  for (const d of inRack) {
    for (const u of unitsFor(d)) occupiedUnits.set(u, d)
  }

  const rows: number[] = Array.from({ length: rack.heightU }, (_, i) => rack.heightU - i)

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {rack.name} <span className="text-xs text-muted-foreground">({rack.heightU} HE)</span>
          </span>
          <Button size="sm" variant="outline" onClick={exportPng}>
            <Download className="h-3.5 w-3.5" /> PNG
          </Button>
        </div>
        <div
          ref={rackRef}
          className="w-72 rounded-md border-4 border-zinc-800 bg-black p-2"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(34,197,94,0.15) 1px, transparent 1px)',
            backgroundSize: '100% 24px',
          }}
        >
          {rows.map((u) => {
            const device = occupiedUnits.get(u)
            const isStart = device && device.rackUnit === u
            if (device && !isStart) return null
            if (device && isStart) {
              const size = device.heSize || 1
              return (
                <div
                  key={u}
                  style={{ height: `${size * 24 - 2}px` }}
                  className={cn(
                    'group relative mb-0.5 flex items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-white',
                    DEVICE_RACK_COLORS[device.type],
                  )}
                >
                  <DeviceIcon type={device.type} className="h-3.5 w-3.5 shrink-0" />
                  <Link to={`/devices/${device.id}`} className="truncate hover:underline">
                    {device.name}
                  </Link>
                  <span className="ml-auto shrink-0 text-[10px] opacity-80">U{u}</span>
                  {canEdit && (
                    <button
                      onClick={() => unassign(device)}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-white group-hover:flex"
                      title="Aus Rack entfernen"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            }
            return (
              <div
                key={u}
                onDragOver={(e) => {
                  if (!canEdit) return
                  e.preventDefault()
                  setDragOverUnit(u)
                }}
                onDragLeave={() => setDragOverUnit(null)}
                onDrop={(e) => canEdit && handleDrop(e, u)}
                style={{ height: '22px' }}
                className={cn(
                  'mb-0.5 flex items-center rounded-sm bg-zinc-700/60 px-2 text-[10px] text-zinc-400',
                  dragOverUnit === u && 'bg-zinc-500/60 ring-1 ring-success',
                )}
              >
                U{u}
              </div>
            )
          })}
        </div>
      </div>

      {canEdit && (
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Nicht zugeordnete Geräte (hierher ziehen)
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {unassigned.length === 0 && <p className="text-xs text-muted-foreground">Alle Geräte zugeordnet.</p>}
            {unassigned.map((device) => (
              <div
                key={device.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', device.id)}
                className="flex cursor-grab items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs active:cursor-grabbing"
              >
                <DeviceIcon type={device.type} className="h-3.5 w-3.5 text-muted-foreground" />
                {device.name}
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={device.heSize || 1}
                  onChange={(e) => setHeSize(device, Number(e.target.value) || 1)}
                  className="w-10 rounded border border-input bg-background px-1 py-0.5 text-center text-[10px]"
                  title="Höhe in HE"
                />
                <span className="text-[10px] text-muted-foreground">HE</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function RacksSection({ siteId }: RacksSectionProps) {
  const racks = useDataStore((s) => s.racks).filter((r) => r.siteId === siteId)
  const devices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const deleteRack = useDataStore((s) => s.deleteRack)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Rack | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Racks</h3>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Rack anlegen
          </Button>
        )}
      </div>

      {racks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
          <Server className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine Racks angelegt.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {racks.map((rack) => (
            <div key={rack.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex items-center justify-end gap-1">
                {canEdit && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(rack)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(rack.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
              <RackVisual rack={rack} devices={devices} canEdit={canEdit} />
            </div>
          ))}
        </div>
      )}

      <RackFormDialog open={formOpen} onOpenChange={setFormOpen} siteId={siteId} rack={editing} />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Rack löschen"
        description="Zugeordnete Geräte werden nicht gelöscht, verlieren aber ihre Rack-Position."
        onConfirm={() => deleteId && deleteRack(deleteId)}
      />
    </div>
  )
}
