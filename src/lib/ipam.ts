import type { Device } from '@/types'

export interface SubnetGroup {
  network: string // e.g. "192.168.1"
  occupied: Map<number, Device> // last octet -> device
}

function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) return false
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255)
}

export function buildSubnetGroups(devices: Device[]): SubnetGroup[] {
  const groups = new Map<string, SubnetGroup>()

  for (const device of devices) {
    if (!device.ipv4 || !isValidIpv4(device.ipv4)) continue
    const parts = device.ipv4.trim().split('.').map(Number)
    const network = `${parts[0]}.${parts[1]}.${parts[2]}`
    const lastOctet = parts[3]

    if (!groups.has(network)) {
      groups.set(network, { network, occupied: new Map() })
    }
    groups.get(network)!.occupied.set(lastOctet, device)
  }

  return [...groups.values()].sort((a, b) => a.network.localeCompare(b.network))
}
