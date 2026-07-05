import type { ChangelogEntry } from '@/types'
import { getDb } from './db'

export async function getAllChangelog(): Promise<ChangelogEntry[]> {
  const db = await getDb()
  return db.getAll('changelog')
}

export async function getChangelogByDevice(deviceId: string): Promise<ChangelogEntry[]> {
  const db = await getDb()
  return db.getAllFromIndex('changelog', 'deviceId', deviceId)
}

export async function getChangelogBySite(siteId: string): Promise<ChangelogEntry[]> {
  const db = await getDb()
  return db.getAllFromIndex('changelog', 'siteId', siteId)
}

export async function putChangelogEntry(entry: ChangelogEntry): Promise<void> {
  const db = await getDb()
  await db.put('changelog', entry)
}

export async function deleteChangelogEntry(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('changelog', id)
}
