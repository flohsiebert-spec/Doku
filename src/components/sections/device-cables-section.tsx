import { Link } from 'react-router-dom'
import { Cable as CableIcon } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Badge } from '@/components/ui/badge'

interface DeviceCablesSectionProps {
  deviceId: string
}

export function DeviceCablesSection({ deviceId }: DeviceCablesSectionProps) {
  const cables = useDataStore((s) => s.cables).filter((c) => c.fromDeviceId === deviceId || c.toDeviceId === deviceId)
  const devices = useDataStore((s) => s.devices)
  const vlans = useDataStore((s) => s.vlans)

  function otherEnd(cable: (typeof cables)[number]) {
    const isFrom = cable.fromDeviceId === deviceId
    const ownPort = isFrom ? cable.fromPort : cable.toPort
    const otherDeviceId = isFrom ? cable.toDeviceId : cable.fromDeviceId
    const otherPort = isFrom ? cable.toPort : cable.fromPort
    return { ownPort, otherDeviceId, otherPort }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Kabelverbindungen</h3>
      {cables.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <CableIcon className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Keine Kabelverbindungen für dieses Gerät.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cables.map((cable) => {
            const { ownPort, otherDeviceId, otherPort } = otherEnd(cable)
            const otherDevice = devices.find((d) => d.id === otherDeviceId)
            const vlan = vlans.find((v) => v.id === cable.vlanId)
            return (
              <div key={cable.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Port {ownPort}</span>
                  <span className="text-muted-foreground">→</span>
                  <Link to={`/devices/${otherDeviceId}`} className="font-medium hover:underline">
                    {otherDevice?.name ?? '—'}
                  </Link>
                  <span className="text-muted-foreground">Port {otherPort}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{cable.cableType}</Badge>
                  {cable.length && <span>{cable.length}</span>}
                  {cable.color && <span>{cable.color}</span>}
                  <Badge variant="outline">{cable.portMode === 'trunk' ? 'Trunk' : 'Access'}</Badge>
                  {vlan && <Badge variant="outline">VLAN {vlan.vlanId}</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
