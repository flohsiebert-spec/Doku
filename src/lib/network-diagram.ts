import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { Cable, Device } from '@/types'

export interface DeviceNodeData extends Record<string, unknown> {
  device: Device
}

const NODE_WIDTH = 200
const TIER_HEIGHT = 150

/**
 * Builds a simple auto-layouted topology: firewalls/routers on top, switches in the
 * middle, all other devices as leaves. There's no real cabling data, so leaves are
 * heuristically wired to a switch/gateway in the same room, falling back to the first
 * available one.
 */
export function buildNetworkGraph(devices: Device[]): { nodes: Node<DeviceNodeData>[]; edges: Edge[] } {
  const gateways = devices.filter((d) => d.type === 'firewall' || d.type === 'router')
  const switches = devices.filter((d) => d.type === 'switch')
  const leaves = devices.filter((d) => d.type !== 'firewall' && d.type !== 'router' && d.type !== 'switch')

  const tiers: Device[][] = [gateways, switches, leaves].filter((tier) => tier.length > 0)

  const nodes: Node<DeviceNodeData>[] = []
  tiers.forEach((tierDevices, tierIndex) => {
    const totalWidth = tierDevices.length * NODE_WIDTH
    tierDevices.forEach((device, i) => {
      nodes.push({
        id: device.id,
        type: 'device',
        position: { x: i * NODE_WIDTH - totalWidth / 2 + NODE_WIDTH / 2, y: tierIndex * TIER_HEIGHT },
        data: { device },
      })
    })
  })

  const edges: Edge[] = []
  function addEdge(sourceId: string, targetId: string) {
    edges.push({
      id: `${sourceId}->${targetId}`,
      source: sourceId,
      target: targetId,
      markerEnd: { type: MarkerType.ArrowClosed },
    })
  }

  for (const sw of switches) {
    const gw = gateways.find((g) => g.roomId && g.roomId === sw.roomId) ?? gateways[0]
    if (gw) addEdge(gw.id, sw.id)
  }

  for (const leaf of leaves) {
    const sw = switches.find((s) => s.roomId && s.roomId === leaf.roomId) ?? switches[0]
    const target = sw ?? gateways[0]
    if (target) addEdge(target.id, leaf.id)
  }

  return { nodes, edges }
}

/**
 * Builds a topology graph from real cable records: devices become nodes, cables become
 * labeled edges. Devices without a saved manual position fall back to a simple tiered
 * layout (gateways / switches / leaves), matching the heuristic diagram's look.
 */
export function buildCableGraph(
  devices: Device[],
  cables: Cable[],
  savedPositions: Record<string, { x: number; y: number }>,
): { nodes: Node<DeviceNodeData>[]; edges: Edge[] } {
  const gateways = devices.filter((d) => d.type === 'firewall' || d.type === 'router')
  const switches = devices.filter((d) => d.type === 'switch' || d.type === 'patch-panel')
  const leaves = devices.filter((d) => !gateways.includes(d) && !switches.includes(d))
  const tiers: Device[][] = [gateways, switches, leaves]

  const fallbackPositions = new Map<string, { x: number; y: number }>()
  tiers.forEach((tierDevices, tierIndex) => {
    const totalWidth = tierDevices.length * NODE_WIDTH
    tierDevices.forEach((device, i) => {
      fallbackPositions.set(device.id, {
        x: i * NODE_WIDTH - totalWidth / 2 + NODE_WIDTH / 2,
        y: tierIndex * TIER_HEIGHT,
      })
    })
  })

  const nodes: Node<DeviceNodeData>[] = devices.map((device) => ({
    id: device.id,
    type: 'device',
    position: savedPositions[device.id] ?? fallbackPositions.get(device.id) ?? { x: 0, y: 0 },
    data: { device },
  }))

  const deviceIds = new Set(devices.map((d) => d.id))
  const edges: Edge[] = cables
    .filter((c) => deviceIds.has(c.fromDeviceId) && deviceIds.has(c.toDeviceId))
    .map((cable) => ({
      id: cable.id,
      source: cable.fromDeviceId,
      target: cable.toDeviceId,
      label: `${cable.fromPort} ↔ ${cable.toPort}`,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: cable.portMode === 'trunk' ? { strokeDasharray: '6 4' } : undefined,
    }))

  return { nodes, edges }
}
