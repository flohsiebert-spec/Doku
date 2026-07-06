import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { Device } from '@/types'

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
