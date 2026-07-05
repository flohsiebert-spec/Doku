import { useMemo, useState } from 'react'
import { Network } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { intToIp, parseCidr, isIpInSubnet } from '@/lib/ipam'
import type { Device } from '@/types'

interface IpamSectionProps {
  siteId: string
}

const MAX_GRID_ADDRESSES = 1024

export function IpamSection({ siteId }: IpamSectionProps) {
  const devices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const [hovered, setHovered] = useState<string | null>(null)

  const subnets = useMemo(() => {
    const cidrs = Array.from(new Set(devices.map((d) => d.subnet.trim()).filter(Boolean)))
    return cidrs
      .map((cidr) => ({ cidr, info: parseCidr(cidr) }))
      .filter((s): s is { cidr: string; info: NonNullable<ReturnType<typeof parseCidr>> } => s.info !== null)
  }, [devices])

  const devicesWithoutSubnet = devices.filter((d) => !d.subnet.trim() && d.ipv4.trim())

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-sm font-semibold">IP-Adressübersicht (IPAM-Lite)</h3>

      {subnets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <Network className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Kein Subnetz erfasst. Trage bei Geräten ein Subnetz (z. B. 192.168.1.0/24) ein.
          </p>
        </div>
      ) : (
        subnets.map(({ cidr, info }) => {
          const devicesInSubnet = devices.filter((d) => d.ipv4 && isIpInSubnet(d.ipv4, info))
          const usedByIp = new Map<number, Device>()
          for (const d of devicesInSubnet) {
            const n = d.ipv4
              .split('.')
              .reduce((acc, part) => acc * 256 + Number(part), 0)
            usedByIp.set(n, d)
          }
          const used = usedByIp.size
          const free = Math.max(info.usableAddresses - used, 0)
          const showGrid = info.totalAddresses <= MAX_GRID_ADDRESSES

          return (
            <Card key={cidr}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-mono text-sm">{cidr}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="success">{used} belegt</Badge>
                  <Badge variant="secondary">{free} frei</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {showGrid ? (
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${Math.min(32, Math.ceil(Math.sqrt(info.totalAddresses)))}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: info.totalAddresses }, (_, i) => info.networkInt + i).map((ipInt) => {
                      const isNetworkOrBroadcast = ipInt === info.networkInt || ipInt === info.networkInt + info.totalAddresses - 1
                      const device = usedByIp.get(ipInt)
                      const ip = intToIp(ipInt)
                      return (
                        <div
                          key={ipInt}
                          onMouseEnter={() => setHovered(`${ip}${device ? ` · ${device.name}` : ''}`)}
                          onMouseLeave={() => setHovered(null)}
                          title={`${ip}${device ? ` — ${device.name}` : isNetworkOrBroadcast ? ' (reserviert)' : ' (frei)'}`}
                          className={cn(
                            'aspect-square rounded-sm',
                            isNetworkOrBroadcast && 'bg-muted-foreground/20',
                            !isNetworkOrBroadcast && device && 'bg-primary',
                            !isNetworkOrBroadcast && !device && 'bg-success/20',
                          )}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Subnetz zu groß für eine Rasteransicht ({info.totalAddresses} Adressen).
                  </p>
                )}
                <p className="mt-2 h-4 text-xs text-muted-foreground">{hovered}</p>
                {devicesInSubnet.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {devicesInSubnet
                      .slice()
                      .sort((a, b) => a.ipv4.localeCompare(b.ipv4, undefined, { numeric: true }))
                      .map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-sm">
                          <span className="font-mono">{d.ipv4}</span>
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}

      {devicesWithoutSubnet.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Geräte ohne zugeordnetes Subnetz</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {devicesWithoutSubnet.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="font-mono">{d.ipv4}</span>
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
