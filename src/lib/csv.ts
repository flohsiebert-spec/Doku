import type { AuditLogEntry, Device, Site, Vlan } from '@/types'
import { DEVICE_TYPES } from '@/types'

export function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(';'), ...rows.map((r) => r.map(csvEscape).join(';'))].join('\n')
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

export function vlansToCsv(vlans: Vlan[]): string {
  const headers = ['VLAN-ID', 'Name', 'Beschreibung', 'Subnetz']
  const rows = vlans
    .slice()
    .sort((a, b) => a.vlanId - b.vlanId)
    .map((v) => [String(v.vlanId), v.name, v.description, v.subnet])
  return toCsv(headers, rows)
}

const AUDIT_ACTION_LABELS: Record<AuditLogEntry['action'], string> = {
  create: 'Angelegt',
  update: 'Geändert',
  delete: 'Gelöscht',
}

export function auditLogToCsv(entries: AuditLogEntry[]): string {
  const headers = ['Zeitstempel', 'Benutzer', 'Aktion', 'Objekttyp', 'Objekt', 'Feld', 'Alter Wert', 'Neuer Wert']
  const rows = entries.map((e) => [
    e.createdAt,
    e.username,
    AUDIT_ACTION_LABELS[e.action],
    e.entityType,
    e.entityLabel,
    e.field,
    e.oldValue,
    e.newValue,
  ])
  return toCsv(headers, rows)
}
