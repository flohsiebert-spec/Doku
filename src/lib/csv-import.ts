import type { Device, DeviceType } from '@/types'

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
}

/** Minimal CSV parser supporting quoted fields and auto-detecting `,` vs `;` delimiters. */
export function parseCsv(text: string): ParsedCsv {
  const cleaned = text.replace(/^﻿/, '').trim()
  const firstLine = cleaned.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','

  function parseLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"'
          i++
        } else if (char === '"') {
          inQuotes = false
        } else {
          current += char
        }
      } else if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
    fields.push(current)
    return fields.map((f) => f.trim())
  }

  const lines = cleaned.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)
  return { headers, rows }
}

export type ImportableField = Exclude<
  keyof Device,
  'id' | 'createdAt' | 'updatedAt' | 'siteId' | 'roomId' | 'portCount' | 'rackId' | 'rackUnit' | 'heSize'
>

export const IMPORTABLE_FIELDS: { key: ImportableField; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'hostname', label: 'Hostname' },
  { key: 'type', label: 'Gerätetyp' },
  { key: 'ipv4', label: 'IPv4-Adresse' },
  { key: 'ipv6', label: 'IPv6-Adresse' },
  { key: 'subnet', label: 'Subnetz' },
  { key: 'gateway', label: 'Gateway' },
  { key: 'mac', label: 'MAC-Adresse' },
  { key: 'serialNumber', label: 'Seriennummer' },
  { key: 'manufacturer', label: 'Hersteller' },
  { key: 'model', label: 'Modell' },
  { key: 'os', label: 'Betriebssystem' },
  { key: 'firmwareVersion', label: 'Firmware-Version' },
  { key: 'rackPosition', label: 'Rack-Position' },
  { key: 'purchaseDate', label: 'Kaufdatum' },
  { key: 'warrantyUntil', label: 'Garantie bis' },
  { key: 'supplier', label: 'Lieferant' },
  { key: 'notes', label: 'Notizen' },
]

/**
 * Header keyword hints for auto-mapping common export formats (Lansweeper, OCS
 * Inventory, and generic spreadsheets use varying but recognizable column names).
 */
const AUTO_MAP_HINTS: Record<ImportableField, string[]> = {
  name: ['name', 'computername', 'assetname', 'asset name', 'computer name'],
  hostname: ['hostname', 'dnsname', 'dns name'],
  type: ['type', 'assettype', 'asset type', 'category'],
  ipv4: ['ipaddress', 'ip address', 'ipv4', 'ip'],
  ipv6: ['ipv6', 'ipv6address'],
  subnet: ['subnet', 'subnetmask', 'subnet mask'],
  gateway: ['gateway', 'defaultgateway', 'default gateway'],
  mac: ['macaddress', 'mac address', 'mac'],
  serialNumber: ['serialnumber', 'serial number', 'biosserial', 'serial'],
  manufacturer: ['manufacturer', 'vendor', 'systemmanufacturer', 'system manufacturer'],
  model: ['model', 'systemmodel', 'system model'],
  os: ['operatingsystem', 'os name', 'os', 'osname'],
  firmwareVersion: ['firmware', 'firmwareversion', 'firmware version', 'biosversion', 'bios version'],
  rackPosition: ['rackposition', 'rack position', 'rack', 'rackslot', 'rack slot'],
  purchaseDate: ['purchasedate', 'purchase date', 'installdate', 'install date'],
  warrantyUntil: ['warranty', 'warrantydate', 'warranty date', 'warrantyexpiration', 'warranty expiration'],
  supplier: ['supplier', 'vendor2', 'purchasedfrom', 'purchased from'],
  notes: ['notes', 'comment', 'comments', 'description'],
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_-]+/g, '')
}

export function guessMapping(headers: string[]): Partial<Record<ImportableField, string>> {
  const mapping: Partial<Record<ImportableField, string>> = {}
  for (const field of IMPORTABLE_FIELDS) {
    const hints = AUTO_MAP_HINTS[field.key].map(normalizeHeader)
    const match = headers.find((h) => hints.includes(normalizeHeader(h)))
    if (match) mapping[field.key] = match
  }
  return mapping
}

const TYPE_LABEL_TO_VALUE: Record<string, DeviceType> = {
  server: 'server',
  switch: 'switch',
  router: 'router',
  firewall: 'firewall',
  pc: 'pc',
  computer: 'pc',
  workstation: 'pc',
  desktop: 'pc',
  laptop: 'pc',
  printer: 'printer',
  drucker: 'printer',
  ap: 'ap',
  accesspoint: 'ap',
  'access point': 'ap',
  patchpanel: 'patch-panel',
  'patch panel': 'patch-panel',
}

export function resolveDeviceType(value: string | undefined): DeviceType {
  if (!value) return 'other'
  return TYPE_LABEL_TO_VALUE[value.trim().toLowerCase()] ?? 'other'
}
