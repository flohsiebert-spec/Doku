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
  | 'patch-panel'
  | 'other'

export const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: 'server', label: 'Server' },
  { value: 'switch', label: 'Switch' },
  { value: 'router', label: 'Router' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'pc', label: 'PC' },
  { value: 'printer', label: 'Drucker' },
  { value: 'ap', label: 'Access Point' },
  { value: 'patch-panel', label: 'Patch-Panel' },
  { value: 'other', label: 'Sonstige' },
]

/** Device types that expose numbered ports for cabling (switches, patch-panels, firewalls/routers). */
export const PORTED_DEVICE_TYPES: DeviceType[] = ['switch', 'patch-panel', 'router', 'firewall']

export const PATCH_PANEL_SIZES = [12, 24, 48] as const

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
  /** Number of physical ports, relevant for switches / patch-panels. */
  portCount: number
  /** Rack this device is mounted in, if any. */
  rackId: ID | ''
  /** Starting rack unit (1 = bottom), if mounted in a rack. */
  rackUnit: number | null
  /** Height in rack units (U) this device occupies. */
  heSize: number
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
  uploadedAt: string
  note?: string
}

export interface Doc extends BaseEntity {
  name: string
  tags: string[]
  siteId: ID | ''
  deviceId: ID | ''
  /** Binary data is lazy-loaded on demand from the documentBlobs store, keyed by blobKey(). */
  versions: DocumentVersion[]
}

export function blobKey(docId: ID, version: number): string {
  return `${docId}:v${version}`
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

// ---------- VLANs ----------

export interface Vlan extends BaseEntity {
  siteId: ID
  vlanId: number
  name: string
  description: string
  subnet: string
}

// ---------- Cabling ----------

export type CablePortMode = 'access' | 'trunk'

export interface Cable extends BaseEntity {
  siteId: ID
  fromDeviceId: ID
  fromPort: string
  toDeviceId: ID
  toPort: string
  cableType: string
  length: string
  color: string
  vlanId: ID | ''
  portMode: CablePortMode
}

// ---------- Racks ----------

export interface Rack extends BaseEntity {
  siteId: ID
  name: string
  heightU: number
}

// ---------- DNS ----------

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT'

export const DNS_RECORD_TYPES: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT']

export interface DnsEntry extends BaseEntity {
  siteId: ID
  type: DnsRecordType
  name: string
  value: string
  ttl: number
  scope: 'internal' | 'external'
}

// ---------- Certificates ----------

export interface Certificate extends BaseEntity {
  siteId: ID
  deviceId: ID | ''
  domain: string
  issuer: string
  validUntil: string
  notes: string
}

// ---------- Users & Roles ----------

export type UserRole = 'admin' | 'technician' | 'readonly'

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'technician', label: 'Techniker' },
  { value: 'readonly', label: 'Read-Only' },
]

export interface User extends BaseEntity {
  username: string
  displayName: string
  role: UserRole
  /** Base64 PBKDF2 salt used to derive this user's personal key. */
  salt: string
  /** The shared data-encryption key, wrapped (AES-GCM) with this user's personal key. */
  wrappedDataKey: string
}

// ---------- Audit log ----------

export type AuditAction = 'create' | 'update' | 'delete'

export interface AuditLogEntry extends BaseEntity {
  userId: ID
  username: string
  entityType: string
  entityId: string
  entityLabel: string
  field: string
  oldValue: string
  newValue: string
  action: AuditAction
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
  'vlans',
  'cables',
  'racks',
  'dnsEntries',
  'certificates',
  'users',
  'auditLog',
] as const

export type StoreName = (typeof STORE_NAMES)[number]
