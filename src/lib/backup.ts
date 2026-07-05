import {
  changelogRepo,
  credentialsRepo,
  devicesRepo,
  documentsRepo,
  notesRepo,
  roomsRepo,
  siteImagesRepo,
  sitesRepo,
  wipeAllData,
} from '@/db/repository'
import { getDb } from '@/db/database'
import { encryptString, decryptString, getCurrentSaltB64, deriveKeyFromSaltB64 } from '@/lib/crypto'
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

interface BackupPayload {
  version: 1
  exportedAt: string
  sites: Site[]
  rooms: Room[]
  siteImages: SiteImage[]
  devices: Device[]
  credentials: Credential[]
  documents: Doc[]
  notes: Note[]
  changelog: ChangelogEntry[]
}

interface BackupFile {
  app: 'it-doku-backup'
  version: 1
  salt: string
  payload: string
}

export async function createBackup(key: CryptoKey): Promise<string> {
  const salt = getCurrentSaltB64()
  if (!salt) throw new Error('Kein Master-Passwort eingerichtet.')

  const [sites, rooms, siteImages, devices, credentials, documents, notes, changelog] = await Promise.all([
    sitesRepo.getAll(),
    roomsRepo.getAll(),
    siteImagesRepo.getAll(),
    devicesRepo.getAll(),
    credentialsRepo.getAll(),
    documentsRepo.getAll(),
    notesRepo.getAll(),
    changelogRepo.getAll(),
  ])

  const data: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sites,
    rooms,
    siteImages,
    devices,
    credentials,
    documents,
    notes,
    changelog,
  }

  const payload = await encryptString(JSON.stringify(data), key)
  const file: BackupFile = { app: 'it-doku-backup', version: 1, salt, payload }
  return JSON.stringify(file)
}

export async function restoreBackup(fileContent: string, password: string): Promise<BackupPayload> {
  const file = JSON.parse(fileContent) as BackupFile
  if (file.app !== 'it-doku-backup' || !file.salt || !file.payload) {
    throw new Error('Ungültige Backup-Datei.')
  }
  const key = await deriveKeyFromSaltB64(password, file.salt)
  const plaintext = await decryptString(file.payload, key)
  return JSON.parse(plaintext) as BackupPayload
}

export async function applyBackup(data: BackupPayload): Promise<void> {
  await wipeAllData()
  const db = await getDb()
  const stores = [
    ['sites', data.sites],
    ['rooms', data.rooms],
    ['siteImages', data.siteImages],
    ['devices', data.devices],
    ['credentials', data.credentials],
    ['documents', data.documents],
    ['notes', data.notes],
    ['changelog', data.changelog],
  ] as const
  for (const [storeName, items] of stores) {
    const tx = db.transaction(storeName, 'readwrite')
    for (const item of items) {
      await tx.store.put(item as never)
    }
    await tx.done
  }
}
