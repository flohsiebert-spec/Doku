import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DoorOpen, MoreHorizontal, Pencil, Plus, Server, Trash2 } from 'lucide-react'
import type { Room } from '@/types'
import { useDataStore } from '@/store/useDataStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { RoomFormDialog } from './room-form-dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface RoomManagerProps {
  siteId: string
}

export function RoomManager({ siteId }: RoomManagerProps) {
  const allRooms = useDataStore((s) => s.rooms)
  const allDevices = useDataStore((s) => s.devices)
  const rooms = allRooms.filter((r) => r.siteId === siteId)
  const devices = allDevices.filter((d) => d.siteId === siteId)
  const removeRoom = useDataStore((s) => s.removeRoom)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeRoomId = searchParams.get('room')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null)

  const sorted = [...rooms].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus /> Raum anlegen
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={DoorOpen} title="Noch keine Räume/Bereiche angelegt" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((room) => {
            const deviceCount = devices.filter((d) => d.roomId === room.id).length
            const isActive = activeRoomId === room.id
            return (
              <Card
                key={room.id}
                className={cn('cursor-pointer transition-colors', isActive && 'ring-2 ring-primary')}
                onClick={() =>
                  setSearchParams(isActive ? {} : { room: room.id }, { replace: true })
                }
              >
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <DoorOpen className="size-4 text-primary" />
                    {room.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => setEditRoom(room)}>
                        <Pencil /> Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteRoom(room)}>
                        <Trash2 /> Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  {room.description && <p className="line-clamp-2">{room.description}</p>}
                  <p className="flex items-center gap-1 text-xs">
                    <Server className="size-3.5" /> {deviceCount} Geräte
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RoomFormDialog open={dialogOpen} onOpenChange={setDialogOpen} siteId={siteId} />
      {editRoom && (
        <RoomFormDialog
          open={!!editRoom}
          onOpenChange={(o) => !o && setEditRoom(null)}
          siteId={siteId}
          room={editRoom}
        />
      )}
      <ConfirmDialog
        open={!!deleteRoom}
        onOpenChange={(o) => !o && setDeleteRoom(null)}
        title="Raum löschen"
        description={`Möchten Sie "${deleteRoom?.name}" löschen? Geräte in diesem Raum verlieren die Raumzuordnung.`}
        onConfirm={async () => {
          if (deleteRoom) {
            await removeRoom(deleteRoom.id)
            toast.success('Raum gelöscht.')
          }
          setDeleteRoom(null)
        }}
      />
    </div>
  )
}
