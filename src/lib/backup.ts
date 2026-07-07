import {
  cablesRepo,
  certificatesRepo,
  changelogRepo,
  credentialsRepo,
  devicesRepo,
  dnsEntriesRepo,
  documentBlobsRepo,
  documentsRepo,
  notesRepo,
  racksRepo,
  roomsRepo,
  siteImagesRepo,
  sitesRepo,
  vlansRepo,
  wipeAllData,
} from '@/db/repository'
import { getDb } from '@/db/database'
import { encryptString, decryptString, deriveKeyFromSaltB64, generateSaltB64 } from '@/lib/crypto'
import type {
  Cable,
  Certificate,
  ChangelogEntry,
  Credential,
  Device,
  DnsEntry,
  Doc,
  Note,
  Rack,
  Room,
  Site,
  SiteImage,
  Vlan,
} from '@/types'

type CredentialExport = Omit<Credential, 'encryptedPassword'> & { password: string }

interface BackupPayload {
  version: 2
  exportedAt: string
  sites: Site[]
  rooms: Room[]
  siteImages: SiteImage[]
  devices: Device[]
  credentials: CredentialExport[]
  documents: Doc[]
  notes: Note[]
  changelog: ChangelogEntry[]
  vlans: Vlan[]
  cables: Cable[]
  racks: Rack[]
  dnsEntries: DnsEntry[]
  certificates: Certificate[]
  documentBlobs: { id: string; dataUrl: string }[]
}

interface BackupFile {
  app: 'it-doku-backup'
  version: 2
  salt: string
  payload: string
}

/**
 * Backups are protected by a dedicated backup password (independent of any user
 * account), so they can be restored on any installation. Credential secrets are
 * decrypted with the current session's data key before being wrapped in the backup's
 * own encryption, and re-encrypted with the target installation's data key on restore.
 */
export async function createBackup(dataKey: CryptoKey, backupPassword: string): Promise<string> {
  const [
    sites,
    rooms,
    siteImages,
    devices,
    credentials,
    documents,
    notes,
    changelog,
    vlans,
    cables,
    racks,
    dnsEntries,
    certificates,
    documentBlobs,
  ] = await Promise.all([
    sitesRepo.getAll(),
    roomsRepo.getAll(),
    siteImagesRepo.getAll(),
    devicesRepo.getAll(),
    credentialsRepo.getAll(),
    documentsRepo.getAll(),
    notesRepo.getAll(),
    changelogRepo.getAll(),
    vlansRepo.getAll(),
    cablesRepo.getAll(),
    racksRepo.getAll(),
    dnsEntriesRepo.getAll(),
    certificatesRepo.getAll(),
    documentBlobsRepo.getAll(),
  ])

  const credentialsExport: CredentialExport[] = await Promise.all(
    credentials.map(async ({ encryptedPassword, ...rest }) => ({
      ...rest,
      password: await decryptString(encryptedPassword, dataKey),
    })),
  )

  const data: BackupPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    sites,
    rooms,
    siteImages,
    devices,
    credentials: credentialsExport,
    documents,
    notes,
    changelog,
    vlans,
    cables,
    racks,
    dnsEntries,
    certificates,
    documentBlobs,
  }

  const salt = generateSaltB64()
  const key = await deriveKeyFromSaltB64(backupPassword, salt)
  const payload = await encryptString(JSON.stringify(data), key)
  const file: BackupFile = { app: 'it-doku-backup', version: 2, salt, payload }
  return JSON.stringify(file)
}

export async function restoreBackup(fileContent: string, backupPassword: string): Promise<BackupPayload> {
  const file = JSON.parse(fileContent) as BackupFile
  if (file.app !== 'it-doku-backup' || !file.salt || !file.payload) {
    throw new Error('Ungültige Backup-Datei.')
  }
  const key = await deriveKeyFromSaltB64(backupPassword, file.salt)
  const plaintext = await decryptString(file.payload, key)
  return JSON.parse(plaintext) as BackupPayload
}

export async function applyBackup(data: BackupPayload, dataKey: CryptoKey): Promise<void> {
  await wipeAllData()

  const credentials: Credential[] = await Promise.all(
    data.credentials.map(async ({ password, ...rest }) => ({
      ...rest,
      encryptedPassword: await encryptString(password, dataKey),
    })),
  )

  const db = await getDb()
  const stores = [
    ['sites', data.sites],
    ['rooms', data.rooms],
    ['siteImages', data.siteImages],
    ['devices', data.devices],
    ['credentials', credentials],
    ['documents', data.documents],
    ['notes', data.notes],
    ['changelog', data.changelog],
    ['vlans', data.vlans ?? []],
    ['cables', data.cables ?? []],
    ['racks', data.racks ?? []],
    ['dnsEntries', data.dnsEntries ?? []],
    ['certificates', data.certificates ?? []],
    ['documentBlobs', data.documentBlobs ?? []],
  ] as const
  for (const [storeName, items] of stores) {
    const tx = db.transaction(storeName, 'readwrite')
    for (const item of items) {
      await tx.store.put(item as never)
    }
    await tx.done
  }
}
