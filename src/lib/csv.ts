import type { Device, Site } from '@/types'
import { DEVICE_TYPES } from '@/types'

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function devicesToCsv(devices: Device[], sites: Site[]): string {
  const headers = [
    'Name',
    'Hostname',
    'Typ',
    'IPv4',
    'IPv6',
    'Subnetz',
    'Gateway',
    'MAC',
    'Seriennummer',
    'Hersteller',
    'Modell',
    'Standort',
    'Rack-Position',
    'Betriebssystem',
    'Firmware',
    'Kaufdatum',
    'Garantie bis',
    'Lieferant',
  ]
  const rows = devices.map((d) => {
    const site = sites.find((s) => s.id === d.siteId)
    return [
      d.name,
      d.hostname,
      DEVICE_TYPES.find((t) => t.value === d.type)?.label ?? d.type,
      d.ipv4,
      d.ipv6,
      d.subnet,
      d.gateway,
      d.mac,
      d.serialNumber,
      d.manufacturer,
      d.model,
      site?.name ?? '',
      d.rackPosition,
      d.os,
      d.firmwareVersion,
      d.purchaseDate,
      d.warrantyUntil,
      d.supplier,
    ].map(csvEscape)
  })
  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
}
