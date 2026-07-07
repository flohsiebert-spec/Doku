import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Cable as CableIcon, Trash2, Pencil } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CableFormDialog } from '@/pages/network/CableFormDialog'
import { DeviceIcon } from '@/lib/device-icons'
import { PORTED_DEVICE_TYPES, type Cable, type Device } from '@/types'

interface CablingSectionProps {
  siteId: string
}

function PortGrid({
  device,
  cables,
  devices,
  onPortClick,
}: {
  device: Device
  cables: Cable[]
  devices: Device[]
  onPortClick: (port: string, cable: Cable | undefined) => void
}) {
  const ports = Array.from({ length: device.portCount || 24 }, (_, i) => String(i + 1))

  function findCable(port: string) {
    return cables.find(
      (c) =>
        (c.fromDeviceId === device.id && c.fromPort === port) || (c.toDeviceId === device.id && c.toPort === port),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <DeviceIcon type={device.type} className="h-4 w-4 text-primary" />
          {device.name}
          <Badge variant="outline">{device.portCount || 24} Ports</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
          {ports.map((port) => {
            const cable = findCable(port)
            const otherDeviceId = cable ? (cable.fromDeviceId === device.id ? cable.toDeviceId : cable.fromDeviceId) : undefined
            const otherDevice = devices.find((d) => d.id === otherDeviceId)
            return (
              <button
                key={port}
                type="button"
                onClick={() => onPortClick(port, cable)}
                title={cable ? `Port ${port} → ${otherDevice?.name ?? '?'}` : `Port ${port} frei`}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-sm text-[10px] font-medium',
                  cable ? 'bg-primary text-primary-foreground' : 'bg-success/20 text-success hover:bg-success/30',
                )}
              >
                {port}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function CablingSection({ siteId }: CablingSectionProps) {
  const devices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const cables = useDataStore((s) => s.cables).filter((c) => c.siteId === siteId)
  const deleteCable = useDataStore((s) => s.deleteCable)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Cable | undefined>(undefined)
  const [prefill, setPrefill] = useState<{ deviceId: string; port: string } | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedInfo, setSelectedInfo] = useState<{ device: Device; port: string; cable: Cable } | null>(null)

  const portedDevices = devices.filter((d) => PORTED_DEVICE_TYPES.includes(d.type))

  function handlePortClick(device: Device, port: string, cable: Cable | undefined) {
    if (cable) {
      setSelectedInfo({ device, port, cable })
    } else if (canEdit) {
      setEditing(undefined)
      setPrefill({ deviceId: device.id, port })
      setFormOpen(true)
    }
  }

  function deviceName(id: string) {
    return devices.find((d) => d.id === id)?.name ?? '—'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Verkabelung</h3>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setPrefill(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Kabel anlegen
          </Button>
        )}
      </div>

      {portedDevices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <CableIcon className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Keine Switches, Patch-Panels, Router oder Firewalls an diesem Standort für eine Port-Ansicht.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {portedDevices.map((device) => (
            <PortGrid
              key={device.id}
              device={device}
              cables={cables}
              devices={devices}
              onPortClick={(port, cable) => handlePortClick(device, port, cable)}
            />
          ))}
        </div>
      )}

      {selectedInfo && (
        <Card className="border-primary/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <span className="font-medium">
                {selectedInfo.device.name} Port {selectedInfo.port}
              </span>
              {' → '}
              <span className="font-medium">
                {selectedInfo.cable.fromDeviceId === selectedInfo.device.id
                  ? `${deviceName(selectedInfo.cable.toDeviceId)} Port ${selectedInfo.cable.toPort}`
                  : `${deviceName(selectedInfo.cable.fromDeviceId)} Port ${selectedInfo.cable.fromPort}`}
              </span>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{selectedInfo.cable.cableType}</Badge>
                {selectedInfo.cable.length && <span>Länge: {selectedInfo.cable.length}</span>}
                {selectedInfo.cable.color && <span>Farbe: {selectedInfo.cable.color}</span>}
                <Badge variant="outline">{selectedInfo.cable.portMode === 'trunk' ? 'Trunk' : 'Access'}</Badge>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(selectedInfo.cable)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(selectedInfo.cable.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Alle Kabelverbindungen
        </h4>
        {cables.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Kabelverbindungen erfasst.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cables.map((cable) => (
              <div key={cable.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Link to={`/devices/${cable.fromDeviceId}`} className="hover:underline">
                    {deviceName(cable.fromDeviceId)}
                  </Link>
                  <span className="text-muted-foreground">Port {cable.fromPort}</span>
                  <span className="text-muted-foreground">→</span>
                  <Link to={`/devices/${cable.toDeviceId}`} className="hover:underline">
                    {deviceName(cable.toDeviceId)}
                  </Link>
                  <span className="text-muted-foreground">Port {cable.toPort}</span>
                  <Badge variant="secondary">{cable.cableType}</Badge>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(cable)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(cable.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CableFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedInfo(null)
        }}
        siteId={siteId}
        cable={editing}
        defaultFromDeviceId={prefill?.deviceId}
        defaultFromPort={prefill?.port}
      />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Kabelverbindung löschen"
        description="Diese Kabelverbindung wird unwiderruflich gelöscht."
        onConfirm={() => {
          if (deleteId) deleteCable(deleteId)
          setSelectedInfo(null)
        }}
      />
    </div>
  )
}
