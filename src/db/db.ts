import { openDB, type IDBPDatabase } from 'idb'
import type { DokuDB } from './schema'

const DB_NAME = 'doku-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<DokuDB>> | null = null

export function getDb(): Promise<IDBPDatabase<DokuDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DokuDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sites = db.createObjectStore('sites', { keyPath: 'id' })
        sites.createIndex('updatedAt', 'updatedAt')

        const rooms = db.createObjectStore('rooms', { keyPath: 'id' })
        rooms.createIndex('siteId', 'siteId')

        const devices = db.createObjectStore('devices', { keyPath: 'id' })
        devices.createIndex('siteId', 'siteId')
        devices.createIndex('roomId', 'roomId')

        const credentials = db.createObjectStore('credentials', { keyPath: 'id' })
        credentials.createIndex('siteId', 'siteId')
        credentials.createIndex('deviceId', 'deviceId')

        const documents = db.createObjectStore('documents', { keyPath: 'id' })
        documents.createIndex('entityId', 'entityId')

        const notes = db.createObjectStore('notes', { keyPath: 'id' })
        notes.createIndex('entityId', 'entityId')

        const changelog = db.createObjectStore('changelog', { keyPath: 'id' })
        changelog.createIndex('deviceId', 'deviceId')
        changelog.createIndex('siteId', 'siteId')

        db.createObjectStore('settings', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}
