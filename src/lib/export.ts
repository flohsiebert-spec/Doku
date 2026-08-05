import type { Device, Ticket } from '@/types'
import { DEVICE_TYPE_LABELS, TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from '@/types'
import { getAllSites } from '@/db/sites'
import { getAllRooms } from '@/db/rooms'
import { getAllDevices } from '@/db/devices'
import { getAllCredentials } from '@/db/credentials'
import { getAllDocuments } from '@/db/documents'
import { getAllNotes } from '@/db/notes'
import { getAllChangelog } from '@/db/changelog'
import { getAllTickets } from '@/db/tickets'
import { getAppSettings, putAppSettings } from '@/db/settings'
import { getDb } from '@/db/db'

function downloadBlob(content: BlobPart, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const BACKUP_VERSION = 2

export interface BackupData {
  version: number
  exportedAt: string
  sites: Awaited<ReturnType<typeof getAllSites>>
  rooms: Awaited<ReturnType<typeof getAllRooms>>
  devices: Awaited<ReturnType<typeof getAllDevices>>
  credentials: Awaited<ReturnType<typeof getAllCredentials>>
  documents: Awaited<ReturnType<typeof getAllDocuments>>
  notes: Awaited<ReturnType<typeof getAllNotes>>
  changelog: Awaited<ReturnType<typeof getAllChangelog>>
  tickets: Awaited<ReturnType<typeof getAllTickets>>
  settings: Awaited<ReturnType<typeof getAppSettings>>
}

export async function buildBackup(): Promise<BackupData> {
  const [sites, rooms, devices, credentials, documents, notes, changelog, tickets, settings] =
    await Promise.all([
      getAllSites(),
      getAllRooms(),
      getAllDevices(),
      getAllCredentials(),
      getAllDocuments(),
      getAllNotes(),
      getAllChangelog(),
      getAllTickets(),
      getAppSettings(),
    ])
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    sites,
    rooms,
    devices,
    credentials,
    documents,
    notes,
    changelog,
    tickets,
    settings,
  }
}

export async function downloadBackupJson(): Promise<void> {
  const backup = await buildBackup()
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob(JSON.stringify(backup, null, 2), 'application/json', `doku-backup-${dateStr}.json`)
}

export function parseBackupFile(text: string): BackupData {
  const data = JSON.parse(text) as BackupData
  if (!data || typeof data !== 'object' || !Array.isArray(data.sites)) {
    throw new Error('Ungültiges Backup-Format.')
  }
  return data
}

export async function restoreBackup(data: BackupData): Promise<void> {
  const db = await getDb()
  const storeNames = [
    'sites',
    'rooms',
    'devices',
    'credentials',
    'documents',
    'notes',
    'changelog',
    'tickets',
  ] as const
  const tx = db.transaction(storeNames, 'readwrite')
  for (const name of storeNames) {
    const store = tx.objectStore(name)
    await store.clear()
    for (const item of data[name] ?? []) {
      await store.put(item)
    }
  }
  await tx.done
  if (data.settings) {
    await putAppSettings(data.settings)
  }
}

function csvEscape(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadDevicesCsv(
  devices: Device[],
  siteNameById: Map<string, string>,
  roomNameById: Map<string, string>,
): void {
  const headers = [
    'Name',
    'Typ',
    'Hostname',
    'IPv4',
    'IPv6',
    'Subnetz',
    'Gateway',
    'MAC',
    'Standort',
    'Raum',
    'Hersteller',
    'Modell',
    'Seriennummer',
    'Betriebssystem/Firmware',
    'Rack-Position',
    'Kaufdatum',
    'Garantie bis',
    'Lieferant',
    'Notizen',
  ]

  const rows = devices.map((d) =>
    [
      d.name,
      DEVICE_TYPE_LABELS[d.type],
      d.hostname,
      d.ipv4,
      d.ipv6,
      d.subnet,
      d.gateway,
      d.mac,
      siteNameById.get(d.siteId) ?? '',
      d.roomId ? (roomNameById.get(d.roomId) ?? '') : '',
      d.manufacturer,
      d.model,
      d.serialNumber,
      d.osFirmware,
      d.rackPosition,
      d.purchaseDate,
      d.warrantyUntil,
      d.supplier,
      d.notes,
    ]
      .map((v) => csvEscape(String(v ?? '')))
      .join(';'),
  )

  const csv = [headers.join(';'), ...rows].join('\n')
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob('﻿' + csv, 'text/csv;charset=utf-8', `geraete-${dateStr}.csv`)
}

export function downloadTicketsCsv(
  tickets: Ticket[],
  siteNameById: Map<string, string>,
  deviceNameById: Map<string, string>,
): void {
  const headers = [
    'Titel',
    'Status',
    'Priorität',
    'Kategorie',
    'Standort',
    'Gerät',
    'Melder',
    'Zugewiesen an',
    'Fällig am',
    'Angelegt',
    'Aktualisiert',
    'Gelöst am',
    'Beschreibung',
  ]

  const rows = tickets.map((t) =>
    [
      t.title,
      TICKET_STATUS_LABELS[t.status],
      TICKET_PRIORITY_LABELS[t.priority],
      TICKET_CATEGORY_LABELS[t.category],
      t.siteId ? (siteNameById.get(t.siteId) ?? '') : '',
      t.deviceId ? (deviceNameById.get(t.deviceId) ?? '') : '',
      t.requester,
      t.assignee,
      t.dueDate,
      t.createdAt,
      t.updatedAt,
      t.resolvedAt ?? '',
      t.description,
    ]
      .map((v) => csvEscape(String(v ?? '')))
      .join(';'),
  )

  const csv = [headers.join(';'), ...rows].join('\n')
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob('﻿' + csv, 'text/csv;charset=utf-8', `tickets-${dateStr}.csv`)
}
