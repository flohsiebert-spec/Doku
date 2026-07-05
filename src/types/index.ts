export type ID = string

export interface BaseEntity {
  id: ID
  createdAt: string
  updatedAt: string
}

// ---------- Sites ----------

export interface Site extends BaseEntity {
  name: string
  address: string
  description: string
  contactPerson: string
  contactEmail?: string
  contactPhone?: string
}

export interface SiteImage extends BaseEntity {
  siteId: ID
  name: string
  kind: 'floorplan' | 'photo' | 'network' | 'other'
  mimeType: string
  size: number
  dataUrl: string
}

// ---------- Rooms ----------

export interface Room extends BaseEntity {
  siteId: ID
  name: string
  description: string
}

// ---------- Devices ----------

export type DeviceType =
  | 'server'
  | 'switch'
  | 'router'
  | 'firewall'
  | 'pc'
  | 'printer'
  | 'ap'
  | 'other'

export const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: 'server', label: 'Server' },
  { value: 'switch', label: 'Switch' },
  { value: 'router', label: 'Router' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'pc', label: 'PC' },
  { value: 'printer', label: 'Drucker' },
  { value: 'ap', label: 'Access Point' },
  { value: 'other', label: 'Sonstige' },
]

export interface Device extends BaseEntity {
  name: string
  hostname: string
  type: DeviceType
  ipv4: string
  ipv6: string
  subnet: string
  gateway: string
  mac: string
  serialNumber: string
  model: string
  manufacturer: string
  siteId: ID
  roomId: ID | ''
  rackPosition: string
  os: string
  firmwareVersion: string
  purchaseDate: string
  warrantyUntil: string
  supplier: string
  notes: string
}

// ---------- Credentials ----------

export type CredentialCategory =
  | 'admin'
  | 'service'
  | 'wifi'
  | 'vpn'
  | 'web'
  | 'other'

export const CREDENTIAL_CATEGORIES: { value: CredentialCategory; label: string }[] = [
  { value: 'admin', label: 'Admin-Account' },
  { value: 'service', label: 'Service-Account' },
  { value: 'wifi', label: 'WLAN' },
  { value: 'vpn', label: 'VPN' },
  { value: 'web', label: 'Web-Portal' },
  { value: 'other', label: 'Sonstiges' },
]

export interface Credential extends BaseEntity {
  title: string
  username: string
  /** AES-GCM encrypted password, base64 encoded, incl. IV prefix */
  encryptedPassword: string
  url: string
  notes: string
  category: CredentialCategory
  siteId: ID | ''
  deviceId: ID | ''
}

// ---------- Documents ----------

export interface DocumentVersion {
  version: number
  mimeType: string
  size: number
  dataUrl: string
  uploadedAt: string
  note?: string
}

export interface Doc extends BaseEntity {
  name: string
  tags: string[]
  siteId: ID | ''
  deviceId: ID | ''
  versions: DocumentVersion[]
}

// ---------- Notes ----------

export interface Note extends BaseEntity {
  title: string
  content: string
  siteId: ID | ''
  deviceId: ID | ''
}

// ---------- Changelog ----------

export interface ChangelogEntry extends BaseEntity {
  date: string
  description: string
  technician: string
  deviceId: ID | ''
  siteId: ID | ''
  action: 'change' | 'maintenance' | 'restart' | 'install' | 'other'
}

export const STORE_NAMES = [
  'sites',
  'rooms',
  'siteImages',
  'devices',
  'credentials',
  'documents',
  'notes',
  'changelog',
] as const

export type StoreName = (typeof STORE_NAMES)[number]
