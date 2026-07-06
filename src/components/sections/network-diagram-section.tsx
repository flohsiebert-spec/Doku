import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, type NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Waypoints } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useUiStore } from '@/store/uiStore'
import { buildNetworkGraph, type DeviceNodeData } from '@/lib/network-diagram'
import { DeviceIcon } from '@/lib/device-icons'
import { DEVICE_TYPES } from '@/types'

function DeviceNode({ data }: { data: DeviceNodeData }) {
  const { device } = data
  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Link
        to={`/devices/${device.id}`}
        className="block min-w-40 rounded-lg border border-border bg-card px-3 py-2 shadow-sm hover:border-primary/50"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <DeviceIcon type={device.type} className="h-4 w-4 text-primary" />
          {device.name}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {DEVICE_TYPES.find((t) => t.value === device.type)?.label}
          {device.ipv4 ? ` · ${device.ipv4}` : ''}
        </div>
      </Link>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  )
}

const nodeTypes: NodeTypes = { device: DeviceNode }

interface NetworkDiagramSectionProps {
  siteId: string
}

export function NetworkDiagramSection({ siteId }: NetworkDiagramSectionProps) {
  const devices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const theme = useUiStore((s) => s.theme)

  const { nodes, edges } = useMemo(() => buildNetworkGraph(devices), [devices])

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
        <Waypoints className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Noch keine Geräte für ein Netzwerkdiagramm vorhanden.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Automatisch generierte Topologie basierend auf Gerätetyp und Raumzuordnung (Firewall/Router →
        Switch → Endgeräte). Keine echten Verkabelungsdaten.
      </p>
      <div className="h-[600px] overflow-hidden rounded-lg border border-border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode={theme}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={false}
          edgesFocusable={false}
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="!bg-card" />
        </ReactFlow>
      </div>
    </div>
  )
}
