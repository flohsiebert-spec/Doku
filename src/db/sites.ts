import type { Site } from '@/types'
import { getDb } from './db'

export async function getAllSites(): Promise<Site[]> {
  const db = await getDb()
  return db.getAll('sites')
}

export async function getSite(id: string): Promise<Site | undefined> {
  const db = await getDb()
  return db.get('sites', id)
}

export async function putSite(site: Site): Promise<void> {
  const db = await getDb()
  await db.put('sites', site)
}

export async function deleteSite(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('sites', id)
}
