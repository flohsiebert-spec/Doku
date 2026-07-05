import { Link } from 'react-router-dom'
import { Network } from 'lucide-react'
import type { Device } from '@/types'
import { buildSubnetGroups } from '@/lib/ipam'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface IpamViewProps {
  devices: Device[]
}

export function IpamView({ devices }: IpamViewProps) {
  const groups = buildSubnetGroups(devices)

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title="Keine IPv4-Adressen erfasst"
        description="Sobald Geräte mit IPv4-Adresse angelegt sind, erscheint hier die Subnetzübersicht."
      />
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {groups.map((group) => {
          const usedCount = group.occupied.size
          return (
            <Card key={group.network}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="font-mono text-sm">{group.network}.0/24</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {usedCount} / 254 belegt · {254 - usedCount} frei
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(32,minmax(0,1fr))]">
                  {Array.from({ length: 254 }, (_, i) => i + 1).map((lastOctet) => {
                    const device = group.occupied.get(lastOctet)
                    const cell = (
                      <div
                        className={cn(
                          'flex aspect-square items-center justify-center rounded-[3px] text-[8px] font-mono',
                          device
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground/50',
                        )}
                      >
                        {lastOctet}
                      </div>
                    )
                    if (!device) return <div key={lastOctet}>{cell}</div>
                    return (
                      <Tooltip key={lastOctet}>
                        <TooltipTrigger asChild>
                          <Link to={`/devices/${device.id}`}>{cell}</Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          {device.name} · {group.network}.{lastOctet}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
