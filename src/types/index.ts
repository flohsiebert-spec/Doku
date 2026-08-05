// Domain types for the IT documentation app.
// Enums are intentionally modeled as string literal unions + const arrays
// (erasableSyntaxOnly forbids real TS enums).

export interface Site {
  id: string
  name: string
  address: string
  description: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  createdAt: string
  updatedAt: string
}

export interface Room {
  id: string
  siteId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export const DEVICE_TYPES = [
  'server',
  'switch',
  'router',
  'firewall',
  'pc',
  'printer',
  'ap',
  'other',
] as const
export type DeviceType = (typeof DEVICE_TYPES)[number]

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  server: 'Server',
  switch: 'Switch',
  router: 'Router',
  firewall: 'Firewall',
  pc: 'PC',
  printer: 'Drucker',
  ap: 'Access Point',
  other: 'Sonstiges',
}

export interface Device {
  id: string
  siteId: string
  roomId: string | null
  type: DeviceType
  name: string
  hostname: string
  ipv4: string
  ipv6: string
  subnet: string
  gateway: string
  mac: string
  serialNumber: string
  model: string
  manufacturer: string
  rackPosition: string
  osFirmware: string
  purchaseDate: string
  warrantyUntil: string
  supplier: string
  notes: string
  createdAt: string
  updatedAt: string
}

export const CREDENTIAL_CATEGORIES = [
  'admin',
  'service',
  'wifi',
  'vpn',
  'webportal',
  'other',
] as const
export type CredentialCategory = (typeof CREDENTIAL_CATEGORIES)[number]

export const CREDENTIAL_CATEGORY_LABELS: Record<CredentialCategory, string> = {
  admin: 'Admin-Account',
  service: 'Service-Account',
  wifi: 'WLAN',
  vpn: 'VPN',
  webportal: 'Web-Portal',
  other: 'Sonstiges',
}

export interface EncryptedPayload {
  ciphertext: string // base64
  iv: string // base64
}

export interface Credential {
  id: string
  title: string
  username: string
  encryptedPassword: EncryptedPayload | null
  url: string
  notes: string
  category: CredentialCategory
  siteId: string | null
  deviceId: string | null
  createdAt: string
  updatedAt: string
}

export const DOCUMENT_ENTITY_TYPES = ['site', 'device', 'global'] as const
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number]

export interface DocumentVersion {
  versionNumber: number
  fileName: string
  mimeType: string
  size: number
  data: string // base64
  createdAt: string
}

export interface DocumentRecord {
  id: string
  name: string
  entityType: DocumentEntityType
  entityId: string | null
  tags: string[]
  isImage: boolean
  versions: DocumentVersion[]
  createdAt: string
  updatedAt: string
}

export const NOTE_ENTITY_TYPES = ['site', 'device', 'global'] as const
export type NoteEntityType = (typeof NOTE_ENTITY_TYPES)[number]

export interface Note {
  id: string
  title: string
  content: string // markdown
  entityType: NoteEntityType
  entityId: string | null
  createdAt: string
  updatedAt: string
}

export const CHANGELOG_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'maintenance',
  'restart',
  'note',
] as const
export type ChangelogAction = (typeof CHANGELOG_ACTIONS)[number]

export const CHANGELOG_ACTION_LABELS: Record<ChangelogAction, string> = {
  created: 'Angelegt',
  updated: 'Geändert',
  deleted: 'Gelöscht',
  maintenance: 'Wartung',
  restart: 'Neustart',
  note: 'Notiz',
}

export interface ChangelogEntry {
  id: string
  deviceId: string | null
  siteId: string | null
  action: ChangelogAction
  description: string
  technician: string
  createdAt: string
}

export interface AppSettings {
  id: 'app-settings'
  theme: 'light' | 'dark' | 'system'
  passwordSaltB64: string
  passwordCheckPayload: EncryptedPayload | null
}

export const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  waiting: 'Wartet auf Rückmeldung',
  resolved: 'Gelöst',
  closed: 'Geschlossen',
}

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
}

export const TICKET_CATEGORIES = ['hardware', 'software', 'network', 'access', 'other'] as const
export type TicketCategory = (typeof TICKET_CATEGORIES)[number]

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  hardware: 'Hardware',
  software: 'Software',
  network: 'Netzwerk',
  access: 'Zugriff & Berechtigungen',
  other: 'Sonstiges',
}

export interface TicketComment {
  id: string
  message: string
  author: string
  createdAt: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  siteId: string | null
  deviceId: string | null
  requester: string
  assignee: string
  dueDate: string
  comments: TicketComment[]
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}
