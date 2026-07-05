import { Server, Network, Router, ShieldCheck, Monitor, Printer, Wifi, HelpCircle } from 'lucide-react'
import type { DeviceType } from '@/types'

export const DEVICE_ICONS: Record<DeviceType, typeof Server> = {
  server: Server,
  switch: Network,
  router: Router,
  firewall: ShieldCheck,
  pc: Monitor,
  printer: Printer,
  ap: Wifi,
  other: HelpCircle,
}

export function DeviceIcon({ type, className }: { type: DeviceType; className?: string }) {
  const Icon = DEVICE_ICONS[type] ?? HelpCircle
  return <Icon className={className} />
}
