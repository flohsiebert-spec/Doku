import type { DocumentRecord } from '@/types'
import { getDb } from './db'

export async function getAllDocuments(): Promise<DocumentRecord[]> {
  const db = await getDb()
  return db.getAll('documents')
}

export async function getDocumentsByEntity(entityId: string): Promise<DocumentRecord[]> {
  const db = await getDb()
  return db.getAllFromIndex('documents', 'entityId', entityId)
}

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  const db = await getDb()
  return db.get('documents', id)
}

export async function putDocument(doc: DocumentRecord): Promise<void> {
  const db = await getDb()
  await db.put('documents', doc)
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('documents', id)
}
