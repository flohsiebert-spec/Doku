import { Server, Network, Router, ShieldCheck, Monitor, Printer, Wifi, Rows3, HelpCircle } from 'lucide-react'
import type { DeviceType } from '@/types'

export const DEVICE_ICONS: Record<DeviceType, typeof Server> = {
  server: Server,
  switch: Network,
  router: Router,
  firewall: ShieldCheck,
  pc: Monitor,
  printer: Printer,
  ap: Wifi,
  'patch-panel': Rows3,
  other: HelpCircle,
}

export function DeviceIcon({ type, className }: { type: DeviceType; className?: string }) {
  const Icon = DEVICE_ICONS[type] ?? HelpCircle
  return <Icon className={className} />
}

/** Saturated colors chosen to stay legible against a black rack background. */
export const DEVICE_RACK_COLORS: Record<DeviceType, string> = {
  server: 'bg-blue-500',
  switch: 'bg-purple-500',
  router: 'bg-orange-500',
  firewall: 'bg-red-500',
  pc: 'bg-slate-400',
  printer: 'bg-teal-500',
  ap: 'bg-cyan-500',
  'patch-panel': 'bg-zinc-400',
  other: 'bg-gray-400',
}
