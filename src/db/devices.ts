import type { Device } from '@/types'
import { getDb } from './db'

export async function getAllDevices(): Promise<Device[]> {
  const db = await getDb()
  return db.getAll('devices')
}

export async function getDevicesBySite(siteId: string): Promise<Device[]> {
  const db = await getDb()
  return db.getAllFromIndex('devices', 'siteId', siteId)
}

export async function getDevicesByRoom(roomId: string): Promise<Device[]> {
  const db = await getDb()
  return db.getAllFromIndex('devices', 'roomId', roomId)
}

export async function getDevice(id: string): Promise<Device | undefined> {
  const db = await getDb()
  return db.get('devices', id)
}

export async function putDevice(device: Device): Promise<void> {
  const db = await getDb()
  await db.put('devices', device)
}

export async function deleteDevice(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('devices', id)
}
