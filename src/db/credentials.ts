import type { Credential } from '@/types'
import { getDb } from './db'

export async function getAllCredentials(): Promise<Credential[]> {
  const db = await getDb()
  return db.getAll('credentials')
}

export async function getCredentialsBySite(siteId: string): Promise<Credential[]> {
  const db = await getDb()
  return db.getAllFromIndex('credentials', 'siteId', siteId)
}

export async function getCredentialsByDevice(deviceId: string): Promise<Credential[]> {
  const db = await getDb()
  return db.getAllFromIndex('credentials', 'deviceId', deviceId)
}

export async function getCredential(id: string): Promise<Credential | undefined> {
  const db = await getDb()
  return db.get('credentials', id)
}

export async function putCredential(credential: Credential): Promise<void> {
  const db = await getDb()
  await db.put('credentials', credential)
}

export async function deleteCredential(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('credentials', id)
}
