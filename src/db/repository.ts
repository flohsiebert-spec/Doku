import { v4 as uuid } from 'uuid'
import { getDb } from './database'
import { recordAudit } from '@/lib/audit'
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

type WithId<T> = T & { id: string; createdAt: string; updatedAt: string }

type StoreName =
  | 'sites'
  | 'rooms'
  | 'siteImages'
  | 'devices'
  | 'credentials'
  | 'documents'
  | 'notes'
  | 'changelog'
  | 'vlans'
  | 'cables'
  | 'racks'
  | 'dnsEntries'
  | 'certificates'
  | 'users'
  | 'auditLog'

interface RepoOptions<T> {
  /** When set, create/update/remove are diffed and written to the audit log. */
  entityType?: string
  /** Human-friendly label for audit-log rows, defaults to entity.name / .title / .id. */
  getLabel?: (entity: T) => string
  /** Field names whose values should never appear in the audit log (only that they changed). */
  redactFields?: string[]
}

function now() {
  return new Date().toISOString()
}

function defaultLabel<T>(entity: T): string {
  const e = entity as Record<string, unknown>
  return String(e.name ?? e.title ?? e.domain ?? e.username ?? e.id ?? '')
}

function makeRepo<T extends { id: string; createdAt: string; updatedAt: string }>(
  storeName: StoreName,
  options: RepoOptions<T> = {},
) {
  const { entityType, getLabel = defaultLabel, redactFields = [] } = options

  return {
    async getAll(): Promise<T[]> {
      const db = await getDb()
      return (await db.getAll(storeName)) as unknown as T[]
    },
    async get(id: string): Promise<T | undefined> {
      const db = await getDb()
      return (await db.get(storeName, id)) as unknown as T | undefined
    },
    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      const db = await getDb()
      const timestamp = now()
      const entity = {
        ...data,
        id: uuid(),
        createdAt: timestamp,
        updatedAt: timestamp,
      } as unknown as WithId<T>
      await db.put(storeName, entity as never)
      if (entityType) {
        await recordAudit(
          entityType,
          entity.id,
          getLabel(entity as unknown as T),
          'create',
          null,
          entity as unknown as Record<string, unknown>,
          redactFields,
        )
      }
      return entity as unknown as T
    },
    async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
      const db = await getDb()
      const existing = (await db.get(storeName, id)) as unknown as T | undefined
      if (!existing) throw new Error(`${storeName} entity ${id} not found`)
      const updated = { ...existing, ...data, updatedAt: now() } as T
      await db.put(storeName, updated as never)
      if (entityType) {
        await recordAudit(
          entityType,
          id,
          getLabel(updated),
          'update',
          existing as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>,
          redactFields,
        )
      }
      return updated
    },
    async remove(id: string): Promise<void> {
      const db = await getDb()
      const existing = entityType ? ((await db.get(storeName, id)) as unknown as T | undefined) : undefined
      await db.delete(storeName, id)
      if (entityType && existing) {
        await recordAudit(
          entityType,
          id,
          getLabel(existing),
          'delete',
          existing as unknown as Record<string, unknown>,
          null,
          redactFields,
        )
      }
    },
    async byIndex(indexName: string, value: string): Promise<T[]> {
      const db = await getDb()
      return (await db.getAllFromIndex(storeName, indexName as never, value as never)) as unknown as T[]
    },
  }
}

export const sitesRepo = makeRepo<Site>('sites', { entityType: 'site' })
export const roomsRepo = makeRepo<Room>('rooms', { entityType: 'room' })
export const siteImagesRepo = makeRepo<SiteImage>('siteImages')
export const devicesRepo = makeRepo<Device>('devices', { entityType: 'device' })
export const credentialsRepo = makeRepo<Credential>('credentials', {
  entityType: 'credential',
  redactFields: ['encryptedPassword'],
})
export const documentsRepo = makeRepo<Doc>('documents')
export const notesRepo = makeRepo<Note>('notes', { entityType: 'note' })
export const changelogRepo = makeRepo<ChangelogEntry>('changelog')
export const vlansRepo = makeRepo<Vlan>('vlans', { entityType: 'vlan' })
export const cablesRepo = makeRepo<Cable>('cables', { entityType: 'cable' })
export const racksRepo = makeRepo<Rack>('racks', { entityType: 'rack' })
export const dnsEntriesRepo = makeRepo<DnsEntry>('dnsEntries', { entityType: 'dns_entry' })
export const certificatesRepo = makeRepo<Certificate>('certificates', { entityType: 'certificate' })
export const usersRepo = makeRepo<User>('users', {
  entityType: 'user',
  getLabel: (u) => u.displayName || u.username,
  redactFields: ['salt', 'wrappedDataKey'],
})
export const auditLogRepo = makeRepo<AuditLogEntry>('auditLog')

/** Document binary data, lazy-loaded on demand instead of held in memory with the rest of the app state. */
export const documentBlobsRepo = {
  async get(id: string): Promise<string | undefined> {
    const db = await getDb()
    const row = await db.get('documentBlobs', id)
    return row?.dataUrl
  },
  async getAll(): Promise<{ id: string; dataUrl: string }[]> {
    const db = await getDb()
    return db.getAll('documentBlobs')
  },
  async put(id: string, dataUrl: string): Promise<void> {
    const db = await getDb()
    await db.put('documentBlobs', { id, dataUrl })
  },
  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('documentBlobs', id)
  },
}

export async function wipeAllData(): Promise<void> {
  const db = await getDb()
  const stores = [
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
    'auditLog',
    'documentBlobs',
  ] as const
  const tx = db.transaction(stores, 'readwrite')
  await Promise.all(stores.map((s) => tx.objectStore(s).clear()))
  await tx.done
}
