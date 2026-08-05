import type { Ticket } from '@/types'
import { getDb } from './db'

export async function getAllTickets(): Promise<Ticket[]> {
  const db = await getDb()
  return db.getAll('tickets')
}

export async function getTicketsBySite(siteId: string): Promise<Ticket[]> {
  const db = await getDb()
  return db.getAllFromIndex('tickets', 'siteId', siteId)
}

export async function getTicketsByDevice(deviceId: string): Promise<Ticket[]> {
  const db = await getDb()
  return db.getAllFromIndex('tickets', 'deviceId', deviceId)
}

export async function getTicket(id: string): Promise<Ticket | undefined> {
  const db = await getDb()
  return db.get('tickets', id)
}

export async function putTicket(ticket: Ticket): Promise<void> {
  const db = await getDb()
  await db.put('tickets', ticket)
}

export async function deleteTicket(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('tickets', id)
}
