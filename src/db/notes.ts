import type { Note } from '@/types'
import { getDb } from './db'

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDb()
  return db.getAll('notes')
}

export async function getNotesByEntity(entityId: string): Promise<Note[]> {
  const db = await getDb()
  return db.getAllFromIndex('notes', 'entityId', entityId)
}

export async function getNote(id: string): Promise<Note | undefined> {
  const db = await getDb()
  return db.get('notes', id)
}

export async function putNote(note: Note): Promise<void> {
  const db = await getDb()
  await db.put('notes', note)
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('notes', id)
}
