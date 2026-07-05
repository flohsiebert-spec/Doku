import { v4 as uuid } from 'uuid'
import { getDb } from './database'
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

type WithId<T> = T & { id: string; createdAt: string; updatedAt: string }

function now() {
  return new Date().toISOString()
}

function makeRepo<T extends { id: string; createdAt: string; updatedAt: string }>(
  storeName:
    | 'sites'
    | 'rooms'
    | 'siteImages'
    | 'devices'
    | 'credentials'
    | 'documents'
    | 'notes'
    | 'changelog',
) {
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
      return entity as unknown as T
    },
    async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
      const db = await getDb()
      const existing = (await db.get(storeName, id)) as unknown as T | undefined
      if (!existing) throw new Error(`${storeName} entity ${id} not found`)
      const updated = { ...existing, ...data, updatedAt: now() } as T
      await db.put(storeName, updated as never)
      return updated
    },
    async remove(id: string): Promise<void> {
      const db = await getDb()
      await db.delete(storeName, id)
    },
    async byIndex(indexName: string, value: string): Promise<T[]> {
      const db = await getDb()
      return (await db.getAllFromIndex(storeName, indexName as never, value as never)) as unknown as T[]
    },
  }
}

export const sitesRepo = makeRepo<Site>('sites')
export const roomsRepo = makeRepo<Room>('rooms')
export const siteImagesRepo = makeRepo<SiteImage>('siteImages')
export const devicesRepo = makeRepo<Device>('devices')
export const credentialsRepo = makeRepo<Credential>('credentials')
export const documentsRepo = makeRepo<Doc>('documents')
export const notesRepo = makeRepo<Note>('notes')
export const changelogRepo = makeRepo<ChangelogEntry>('changelog')

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
  ] as const
  const tx = db.transaction(stores, 'readwrite')
  await Promise.all(stores.map((s) => tx.objectStore(s).clear()))
  await tx.done
}
