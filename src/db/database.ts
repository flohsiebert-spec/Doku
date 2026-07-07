import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  AuditLogEntry,
  Cable,
  Certificate,
  ChangelogEntry,
  Credential,
  Device,
  DnsEntry,
  Doc,
  Note,
  Rack,
  Room,
  Site,
  SiteImage,
  User,
  Vlan,
} from '@/types'

interface DokuDB extends DBSchema {
  sites: { key: string; value: Site; indexes: { name: string } }
  rooms: { key: string; value: Room; indexes: { siteId: string } }
  siteImages: { key: string; value: SiteImage; indexes: { siteId: string } }
  devices: {
    key: string
    value: Device
    indexes: { siteId: string; roomId: string; type: string; name: string; ipv4: string; mac: string }
  }
  credentials: {
    key: string
    value: Credential
    indexes: { siteId: string; deviceId: string }
  }
  documents: {
    key: string
    value: Doc
    indexes: { siteId: string; deviceId: string }
  }
  notes: {
    key: string
    value: Note
    indexes: { siteId: string; deviceId: string }
  }
  changelog: {
    key: string
    value: ChangelogEntry
    indexes: { siteId: string; deviceId: string; date: string }
  }
  vlans: { key: string; value: Vlan; indexes: { siteId: string } }
  cables: {
    key: string
    value: Cable
    indexes: { siteId: string; fromDeviceId: string; toDeviceId: string }
  }
  racks: { key: string; value: Rack; indexes: { siteId: string } }
  dnsEntries: { key: string; value: DnsEntry; indexes: { siteId: string; type: string } }
  certificates: { key: string; value: Certificate; indexes: { siteId: string; deviceId: string } }
  users: { key: string; value: User; indexes: { username: string } }
  auditLog: {
    key: string
    value: AuditLogEntry
    indexes: { entityType: string; userId: string; entityId: string }
  }
  documentBlobs: { key: string; value: { id: string; dataUrl: string } }
}

const DB_NAME = 'it-doku'
const DB_VERSION = 3

let dbPromise: Promise<IDBPDatabase<DokuDB>> | null = null

export function getDb(): Promise<IDBPDatabase<DokuDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DokuDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const sites = db.createObjectStore('sites', { keyPath: 'id' })
          sites.createIndex('name', 'name')

          const rooms = db.createObjectStore('rooms', { keyPath: 'id' })
          rooms.createIndex('siteId', 'siteId')

          const siteImages = db.createObjectStore('siteImages', { keyPath: 'id' })
          siteImages.createIndex('siteId', 'siteId')

          const devices = db.createObjectStore('devices', { keyPath: 'id' })
          devices.createIndex('siteId', 'siteId')
          devices.createIndex('roomId', 'roomId')
          devices.createIndex('type', 'type')

          const credentials = db.createObjectStore('credentials', { keyPath: 'id' })
          credentials.createIndex('siteId', 'siteId')
          credentials.createIndex('deviceId', 'deviceId')

          const documents = db.createObjectStore('documents', { keyPath: 'id' })
          documents.createIndex('siteId', 'siteId')
          documents.createIndex('deviceId', 'deviceId')

          const notes = db.createObjectStore('notes', { keyPath: 'id' })
          notes.createIndex('siteId', 'siteId')
          notes.createIndex('deviceId', 'deviceId')

          const changelog = db.createObjectStore('changelog', { keyPath: 'id' })
          changelog.createIndex('siteId', 'siteId')
          changelog.createIndex('deviceId', 'deviceId')
          changelog.createIndex('date', 'date')
        }

        if (oldVersion < 2) {
          const devices = transaction.objectStore('devices')
          if (!devices.indexNames.contains('name')) devices.createIndex('name', 'name')
          if (!devices.indexNames.contains('ipv4')) devices.createIndex('ipv4', 'ipv4')
          if (!devices.indexNames.contains('mac')) devices.createIndex('mac', 'mac')

          const vlans = db.createObjectStore('vlans', { keyPath: 'id' })
          vlans.createIndex('siteId', 'siteId')

          const cables = db.createObjectStore('cables', { keyPath: 'id' })
          cables.createIndex('siteId', 'siteId')
          cables.createIndex('fromDeviceId', 'fromDeviceId')
          cables.createIndex('toDeviceId', 'toDeviceId')

          const racks = db.createObjectStore('racks', { keyPath: 'id' })
          racks.createIndex('siteId', 'siteId')

          const dnsEntries = db.createObjectStore('dnsEntries', { keyPath: 'id' })
          dnsEntries.createIndex('siteId', 'siteId')
          dnsEntries.createIndex('type', 'type')

          const certificates = db.createObjectStore('certificates', { keyPath: 'id' })
          certificates.createIndex('siteId', 'siteId')
          certificates.createIndex('deviceId', 'deviceId')

          const users = db.createObjectStore('users', { keyPath: 'id' })
          users.createIndex('username', 'username', { unique: true })

          const auditLog = db.createObjectStore('auditLog', { keyPath: 'id' })
          auditLog.createIndex('entityType', 'entityType')
          auditLog.createIndex('userId', 'userId')
          auditLog.createIndex('entityId', 'entityId')
        }

        if (oldVersion < 3) {
          db.createObjectStore('documentBlobs', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export type { DokuDB }
