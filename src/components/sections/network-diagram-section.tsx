import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type NodeTypes,
  type Node,
  type OnNodeDrag,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toPng } from 'html-to-image'
import { Waypoints, Download } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useUiStore } from '@/store/uiStore'
import { buildNetworkGraph, buildCableGraph, type DeviceNodeData } from '@/lib/network-diagram'
import { DeviceIcon } from '@/lib/device-icons'
import { downloadBlob } from '@/lib/utils'
import { dataUrlToBlob } from '@/lib/files'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

function loadPositions(siteId: string): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(`doku:topology-positions:${siteId}`)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePositions(siteId: string, positions: Record<string, { x: number; y: number }>) {
  localStorage.setItem(`doku:topology-positions:${siteId}`, JSON.stringify(positions))
}

export function NetworkDiagramSection({ siteId }: NetworkDiagramSectionProps) {
  const allDevices = useDataStore((s) => s.devices).filter((d) => d.siteId === siteId)
  const cables = useDataStore((s) => s.cables).filter((c) => c.siteId === siteId)
  const vlans = useDataStore((s) => s.vlans).filter((v) => v.siteId === siteId)
  const theme = useUiStore((s) => s.theme)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [typeFilter, setTypeFilter] = useState('all')
  const [vlanFilter, setVlanFilter] = useState('all')
  const [positions, setPositions] = useState(() => loadPositions(siteId))

  useEffect(() => {
    setPositions(loadPositions(siteId))
  }, [siteId])

  const hasCables = cables.length > 0

  const filteredDevices = useMemo(() => {
    let list = allDevices
    if (typeFilter !== 'all') list = list.filter((d) => d.type === typeFilter)
    if (vlanFilter !== 'all') {
      const idsInVlan = new Set(
        cables.filter((c) => c.vlanId === vlanFilter).flatMap((c) => [c.fromDeviceId, c.toDeviceId]),
      )
      list = list.filter((d) => idsInVlan.has(d.id))
    }
    return list
  }, [allDevices, typeFilter, vlanFilter, cables])

  const { nodes, edges } = useMemo(() => {
    if (hasCables) return buildCableGraph(filteredDevices, cables, positions)
    return buildNetworkGraph(filteredDevices)
  }, [hasCables, filteredDevices, cables, positions])

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node: Node) => {
      setPositions((prev) => {
        const next = { ...prev, [node.id]: node.position }
        savePositions(siteId, next)
        return next
      })
    },
    [siteId],
  )

  async function exportPng() {
    if (!wrapperRef.current) return
    const dataUrl = await toPng(wrapperRef.current)
    downloadBlob(dataUrlToBlob(dataUrl), `netzwerktopologie-${siteId}.png`)
  }

  if (allDevices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
        <Waypoints className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Noch keine Geräte für ein Netzwerkdiagramm vorhanden.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {hasCables
            ? 'Topologie basierend auf erfassten Kabelverbindungen. Knoten lassen sich verschieben, Positionen werden gespeichert.'
            : 'Keine Kabel erfasst — automatisch generierte Topologie basierend auf Gerätetyp und Raumzuordnung.'}
        </p>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Gerätetypen</SelectItem>
              {DEVICE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vlanFilter} onValueChange={setVlanFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle VLANs</SelectItem>
              {vlans.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  VLAN {v.vlanId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportPng}>
            <Download className="h-4 w-4" /> PNG
          </Button>
        </div>
      </div>
      <div ref={wrapperRef} className="h-[600px] overflow-hidden rounded-lg border border-border">
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
          onNodeDragStop={handleNodeDragStop}
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="!bg-card" />
        </ReactFlow>
      </div>
    </div>
  )
}
