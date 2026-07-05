import type { DBSchema } from 'idb'
import type {
  AppSettings,
  ChangelogEntry,
  Credential,
  Device,
  DocumentRecord,
  Note,
  Room,
  Site,
} from '@/types'

export interface DokuDB extends DBSchema {
  sites: {
    key: string
    value: Site
    indexes: { updatedAt: string }
  }
  rooms: {
    key: string
    value: Room
    indexes: { siteId: string }
  }
  devices: {
    key: string
    value: Device
    indexes: { siteId: string; roomId: string }
  }
  credentials: {
    key: string
    value: Credential
    indexes: { siteId: string; deviceId: string }
  }
  documents: {
    key: string
    value: DocumentRecord
    indexes: { entityId: string }
  }
  notes: {
    key: string
    value: Note
    indexes: { entityId: string }
  }
  changelog: {
    key: string
    value: ChangelogEntry
    indexes: { deviceId: string; siteId: string }
  }
  settings: {
    key: string
    value: AppSettings
  }
}
