import type { Room } from '@/types'
import { getDb } from './db'

export async function getAllRooms(): Promise<Room[]> {
  const db = await getDb()
  return db.getAll('rooms')
}

export async function getRoomsBySite(siteId: string): Promise<Room[]> {
  const db = await getDb()
  return db.getAllFromIndex('rooms', 'siteId', siteId)
}

export async function getRoom(id: string): Promise<Room | undefined> {
  const db = await getDb()
  return db.get('rooms', id)
}

export async function putRoom(room: Room): Promise<void> {
  const db = await getDb()
  await db.put('rooms', room)
}

export async function deleteRoom(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('rooms', id)
}
