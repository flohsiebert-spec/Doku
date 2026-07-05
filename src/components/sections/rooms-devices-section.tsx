import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, DoorOpen, Server } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { RoomFormDialog } from '@/pages/sites/RoomFormDialog'
import { DeviceFormDialog } from '@/pages/devices/DeviceFormDialog'
import { DeviceIcon } from '@/lib/device-icons'
import type { Room } from '@/types'

interface RoomsDevicesSectionProps {
  siteId: string
}

export function RoomsDevicesSection({ siteId }: RoomsDevicesSectionProps) {
  const rooms = useDataStore((s) => s.rooms).filter((r) => r.siteId === siteId)
  const devices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const deleteRoom = useDataStore((s) => s.deleteRoom)
  const deleteDevice = useDataStore((s) => s.deleteDevice)

  const [roomFormOpen, setRoomFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined)
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null)

  const [deviceFormOpen, setDeviceFormOpen] = useState(false)
  const [editingDeviceId, setEditingDeviceId] = useState<string | undefined>(undefined)
  const [defaultRoomId, setDefaultRoomId] = useState<string | undefined>(undefined)
  const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null)

  const editingDevice = devices.find((d) => d.id === editingDeviceId)

  const groups: { room?: Room; devices: typeof devices }[] = [
    ...rooms.map((room) => ({ room, devices: devices.filter((d) => d.roomId === room.id) })),
    { room: undefined, devices: devices.filter((d) => !d.roomId) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Räume & Bereiche</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingRoom(undefined)
              setRoomFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Raum
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingDeviceId(undefined)
              setDefaultRoomId(undefined)
              setDeviceFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Gerät
          </Button>
        </div>
      </div>

      {rooms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center gap-1 rounded-md border border-border py-1 pl-2.5 pr-1 text-sm">
              <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
              {room.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setEditingRoom(room)
                  setRoomFormOpen(true)
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteRoomId(room.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {groups
          .filter((g) => g.devices.length > 0 || g.room)
          .map((group) => (
            <div key={group.room?.id ?? 'no-room'} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.room ? group.room.name : 'Ohne Raum'}
                </span>
                {group.room && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingDeviceId(undefined)
                      setDefaultRoomId(group.room!.id)
                      setDeviceFormOpen(true)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Gerät hier hinzufügen
                  </Button>
                )}
              </div>
              {group.devices.length === 0 ? (
                <p className="pl-1 text-xs text-muted-foreground/70">Keine Geräte</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.devices.map((device) => (
                    <Card key={device.id} className="relative">
                      <CardContent className="flex flex-col gap-1.5 p-3">
                        <Link to={`/devices/${device.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                          <DeviceIcon type={device.type} className="h-4 w-4 text-muted-foreground" />
                          {device.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {device.ipv4 && <Badge variant="secondary">{device.ipv4}</Badge>}
                          {device.model && <span>{device.model}</span>}
                        </div>
                        <div className="absolute right-2 top-2 flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingDeviceId(device.id)
                              setDeviceFormOpen(true)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteDeviceId(device.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        {devices.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
            <Server className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Noch keine Geräte an diesem Standort.</p>
          </div>
        )}
      </div>

      <RoomFormDialog open={roomFormOpen} onOpenChange={setRoomFormOpen} siteId={siteId} room={editingRoom} />
      <DeviceFormDialog
        open={deviceFormOpen}
        onOpenChange={setDeviceFormOpen}
        device={editingDevice}
        defaultSiteId={siteId}
        defaultRoomId={defaultRoomId}
      />
      <ConfirmDialog
        open={deleteRoomId !== null}
        onOpenChange={(open) => !open && setDeleteRoomId(null)}
        title="Raum löschen"
        description="Geräte in diesem Raum werden nicht gelöscht, aber der Raumbezug wird entfernt."
        onConfirm={() => deleteRoomId && deleteRoom(deleteRoomId)}
      />
      <ConfirmDialog
        open={deleteDeviceId !== null}
        onOpenChange={(open) => !open && setDeleteDeviceId(null)}
        title="Gerät löschen"
        description="Das Gerät sowie verknüpfte Zugangsdaten, Dokumente, Notizen und Protokolleinträge werden gelöscht."
        onConfirm={() => deleteDeviceId && deleteDevice(deleteDeviceId)}
      />
    </div>
  )
}
