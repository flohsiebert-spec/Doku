import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  ChangelogEntry,
  Credential,
  Device,
  Doc,
  Note,
  Room,
  Site,
  SiteImage,
} from '@/types'

interface DokuDB extends DBSchema {
  sites: { key: string; value: Site; indexes: { name: string } }
  rooms: { key: string; value: Room; indexes: { siteId: string } }
  siteImages: { key: string; value: SiteImage; indexes: { siteId: string } }
  devices: {
    key: string
    value: Device
    indexes: { siteId: string; roomId: string; type: string }
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
}

const DB_NAME = 'it-doku'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<DokuDB>> | null = null

export function getDb(): Promise<IDBPDatabase<DokuDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DokuDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
      },
    })
  }
  return dbPromise
}

export type { DokuDB }
