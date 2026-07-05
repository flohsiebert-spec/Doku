import { create } from 'zustand'
import type {
  ChangelogAction,
  ChangelogEntry,
  Credential,
  Device,
  DocumentEntityType,
  DocumentRecord,
  Note,
  NoteEntityType,
  Room,
  Site,
} from '@/types'
import { newId, nowIso } from '@/lib/utils'
import { getAllSites, putSite, deleteSite as dbDeleteSite } from '@/db/sites'
import { getAllRooms, putRoom, deleteRoom as dbDeleteRoom } from '@/db/rooms'
import { getAllDevices, putDevice, deleteDevice as dbDeleteDevice } from '@/db/devices'
import {
  getAllCredentials,
  putCredential,
  deleteCredential as dbDeleteCredential,
} from '@/db/credentials'
import { getAllDocuments, putDocument, deleteDocument as dbDeleteDocument } from '@/db/documents'
import { getAllNotes, putNote, deleteNote as dbDeleteNote } from '@/db/notes'
import {
  getAllChangelog,
  putChangelogEntry,
  deleteChangelogEntry as dbDeleteChangelogEntry,
} from '@/db/changelog'
import { useUIStore } from './useUIStore'

interface DataState {
  loaded: boolean
  sites: Site[]
  rooms: Room[]
  devices: Device[]
  credentials: Credential[]
  documents: DocumentRecord[]
  notes: Note[]
  changelog: ChangelogEntry[]

  loadAll: () => Promise<void>

  createSite: (input: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Site>
  updateSite: (id: string, input: Partial<Omit<Site, 'id' | 'createdAt'>>) => Promise<void>
  removeSite: (id: string) => Promise<void>

  createRoom: (input: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Room>
  updateRoom: (id: string, input: Partial<Omit<Room, 'id' | 'createdAt'>>) => Promise<void>
  removeRoom: (id: string) => Promise<void>

  createDevice: (input: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Device>
  updateDevice: (id: string, input: Partial<Omit<Device, 'id' | 'createdAt'>>) => Promise<void>
  removeDevice: (id: string) => Promise<void>

  createCredential: (input: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Credential>
  updateCredential: (
    id: string,
    input: Partial<Omit<Credential, 'id' | 'createdAt'>>,
  ) => Promise<void>
  removeCredential: (id: string) => Promise<void>

  createDocument: (input: {
    name: string
    entityType: DocumentEntityType
    entityId: string | null
    tags: string[]
    isImage: boolean
    fileName: string
    mimeType: string
    size: number
    data: string
  }) => Promise<DocumentRecord>
  addDocumentVersion: (
    id: string,
    version: { fileName: string; mimeType: string; size: number; data: string },
  ) => Promise<void>
  updateDocumentMeta: (
    id: string,
    input: Partial<Pick<DocumentRecord, 'name' | 'tags'>>,
  ) => Promise<void>
  removeDocument: (id: string) => Promise<void>

  createNote: (input: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>
  updateNote: (id: string, input: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<void>
  removeNote: (id: string) => Promise<void>

  addChangelogEntry: (input: {
    deviceId: string | null
    siteId: string | null
    action: ChangelogAction
    description: string
    technician?: string
  }) => Promise<void>
  removeChangelogEntry: (id: string) => Promise<void>
}

function technician(explicit?: string): string {
  return explicit?.trim() || useUIStore.getState().technicianName || 'Unbekannt'
}

export const useDataStore = create<DataState>((set, get) => ({
  loaded: false,
  sites: [],
  rooms: [],
  devices: [],
  credentials: [],
  documents: [],
  notes: [],
  changelog: [],

  loadAll: async () => {
    const [sites, rooms, devices, credentials, documents, notes, changelog] = await Promise.all([
      getAllSites(),
      getAllRooms(),
      getAllDevices(),
      getAllCredentials(),
      getAllDocuments(),
      getAllNotes(),
      getAllChangelog(),
    ])
    set({ loaded: true, sites, rooms, devices, credentials, documents, notes, changelog })
  },

  createSite: async (input) => {
    const now = nowIso()
    const site: Site = { ...input, id: newId(), createdAt: now, updatedAt: now }
    await putSite(site)
    set({ sites: [...get().sites, site] })
    return site
  },

  updateSite: async (id, input) => {
    const existing = get().sites.find((s) => s.id === id)
    if (!existing) return
    const updated: Site = { ...existing, ...input, updatedAt: nowIso() }
    await putSite(updated)
    set({ sites: get().sites.map((s) => (s.id === id ? updated : s)) })
  },

  removeSite: async (id) => {
    const state = get()
    const roomIds = state.rooms.filter((r) => r.siteId === id).map((r) => r.id)
    const deviceIds = state.devices.filter((d) => d.siteId === id).map((d) => d.id)

    await Promise.all([
      dbDeleteSite(id),
      ...roomIds.map((rid) => dbDeleteRoom(rid)),
      ...deviceIds.map((did) => dbDeleteDevice(did)),
      ...state.credentials
        .filter((c) => c.siteId === id || (c.deviceId && deviceIds.includes(c.deviceId)))
        .map((c) => dbDeleteCredential(c.id)),
      ...state.documents
        .filter((d) => d.entityId === id || (d.entityId && deviceIds.includes(d.entityId)))
        .map((d) => dbDeleteDocument(d.id)),
      ...state.notes
        .filter((n) => n.entityId === id || (n.entityId && deviceIds.includes(n.entityId)))
        .map((n) => dbDeleteNote(n.id)),
      ...state.changelog
        .filter((c) => c.siteId === id || (c.deviceId && deviceIds.includes(c.deviceId)))
        .map((c) => dbDeleteChangelogEntry(c.id)),
    ])

    set({
      sites: state.sites.filter((s) => s.id !== id),
      rooms: state.rooms.filter((r) => r.siteId !== id),
      devices: state.devices.filter((d) => d.siteId !== id),
      credentials: state.credentials.filter(
        (c) => c.siteId !== id && !(c.deviceId && deviceIds.includes(c.deviceId)),
      ),
      documents: state.documents.filter(
        (d) => d.entityId !== id && !(d.entityId && deviceIds.includes(d.entityId)),
      ),
      notes: state.notes.filter(
        (n) => n.entityId !== id && !(n.entityId && deviceIds.includes(n.entityId)),
      ),
      changelog: state.changelog.filter(
        (c) => c.siteId !== id && !(c.deviceId && deviceIds.includes(c.deviceId)),
      ),
    })
  },

  createRoom: async (input) => {
    const now = nowIso()
    const room: Room = { ...input, id: newId(), createdAt: now, updatedAt: now }
    await putRoom(room)
    set({ rooms: [...get().rooms, room] })
    return room
  },

  updateRoom: async (id, input) => {
    const existing = get().rooms.find((r) => r.id === id)
    if (!existing) return
    const updated: Room = { ...existing, ...input, updatedAt: nowIso() }
    await putRoom(updated)
    set({ rooms: get().rooms.map((r) => (r.id === id ? updated : r)) })
  },

  removeRoom: async (id) => {
    await dbDeleteRoom(id)
    const state = get()
    const updatedDevices = state.devices.map((d) => (d.roomId === id ? { ...d, roomId: null } : d))
    await Promise.all(
      updatedDevices.filter((d) => d.roomId === null).map((d) => putDevice(d)),
    )
    set({ rooms: state.rooms.filter((r) => r.id !== id), devices: updatedDevices })
  },

  createDevice: async (input) => {
    const now = nowIso()
    const device: Device = { ...input, id: newId(), createdAt: now, updatedAt: now }
    await putDevice(device)
    set({ devices: [...get().devices, device] })
    await get().addChangelogEntry({
      deviceId: device.id,
      siteId: device.siteId,
      action: 'created',
      description: `Gerät "${device.name}" angelegt.`,
    })
    return device
  },

  updateDevice: async (id, input) => {
    const existing = get().devices.find((d) => d.id === id)
    if (!existing) return
    const updated: Device = { ...existing, ...input, updatedAt: nowIso() }
    await putDevice(updated)
    set({ devices: get().devices.map((d) => (d.id === id ? updated : d)) })
    await get().addChangelogEntry({
      deviceId: id,
      siteId: updated.siteId,
      action: 'updated',
      description: `Gerät "${updated.name}" geändert.`,
    })
  },

  removeDevice: async (id) => {
    const state = get()
    await Promise.all([
      dbDeleteDevice(id),
      ...state.credentials.filter((c) => c.deviceId === id).map((c) => dbDeleteCredential(c.id)),
      ...state.documents.filter((d) => d.entityId === id).map((d) => dbDeleteDocument(d.id)),
      ...state.notes.filter((n) => n.entityId === id).map((n) => dbDeleteNote(n.id)),
      ...state.changelog.filter((c) => c.deviceId === id).map((c) => dbDeleteChangelogEntry(c.id)),
    ])
    set({
      devices: state.devices.filter((d) => d.id !== id),
      credentials: state.credentials.filter((c) => c.deviceId !== id),
      documents: state.documents.filter((d) => d.entityId !== id),
      notes: state.notes.filter((n) => n.entityId !== id),
      changelog: state.changelog.filter((c) => c.deviceId !== id),
    })
  },

  createCredential: async (input) => {
    const now = nowIso()
    const credential: Credential = { ...input, id: newId(), createdAt: now, updatedAt: now }
    await putCredential(credential)
    set({ credentials: [...get().credentials, credential] })
    return credential
  },

  updateCredential: async (id, input) => {
    const existing = get().credentials.find((c) => c.id === id)
    if (!existing) return
    const updated: Credential = { ...existing, ...input, updatedAt: nowIso() }
    await putCredential(updated)
    set({ credentials: get().credentials.map((c) => (c.id === id ? updated : c)) })
  },

  removeCredential: async (id) => {
    await dbDeleteCredential(id)
    set({ credentials: get().credentials.filter((c) => c.id !== id) })
  },

  createDocument: async (input) => {
    const now = nowIso()
    const doc: DocumentRecord = {
      id: newId(),
      name: input.name,
      entityType: input.entityType,
      entityId: input.entityId,
      tags: input.tags,
      isImage: input.isImage,
      versions: [
        {
          versionNumber: 1,
          fileName: input.fileName,
          mimeType: input.mimeType,
          size: input.size,
          data: input.data,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }
    await putDocument(doc)
    set({ documents: [...get().documents, doc] })
    return doc
  },

  addDocumentVersion: async (id, version) => {
    const existing = get().documents.find((d) => d.id === id)
    if (!existing) return
    const nextVersionNumber = existing.versions.length + 1
    const updated: DocumentRecord = {
      ...existing,
      versions: [
        ...existing.versions,
        { ...version, versionNumber: nextVersionNumber, createdAt: nowIso() },
      ],
      updatedAt: nowIso(),
    }
    await putDocument(updated)
    set({ documents: get().documents.map((d) => (d.id === id ? updated : d)) })
  },

  updateDocumentMeta: async (id, input) => {
    const existing = get().documents.find((d) => d.id === id)
    if (!existing) return
    const updated: DocumentRecord = { ...existing, ...input, updatedAt: nowIso() }
    await putDocument(updated)
    set({ documents: get().documents.map((d) => (d.id === id ? updated : d)) })
  },

  removeDocument: async (id) => {
    await dbDeleteDocument(id)
    set({ documents: get().documents.filter((d) => d.id !== id) })
  },

  createNote: async (input) => {
    const now = nowIso()
    const note: Note = { ...input, id: newId(), createdAt: now, updatedAt: now }
    await putNote(note)
    set({ notes: [...get().notes, note] })
    return note
  },

  updateNote: async (id, input) => {
    const existing = get().notes.find((n) => n.id === id)
    if (!existing) return
    const updated: Note = { ...existing, ...input, updatedAt: nowIso() }
    await putNote(updated)
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) })
  },

  removeNote: async (id) => {
    await dbDeleteNote(id)
    set({ notes: get().notes.filter((n) => n.id !== id) })
  },

  addChangelogEntry: async (input) => {
    const entry: ChangelogEntry = {
      id: newId(),
      deviceId: input.deviceId,
      siteId: input.siteId,
      action: input.action,
      description: input.description,
      technician: technician(input.technician),
      createdAt: nowIso(),
    }
    await putChangelogEntry(entry)
    set({ changelog: [...get().changelog, entry] })
  },

  removeChangelogEntry: async (id) => {
    await dbDeleteChangelogEntry(id)
    set({ changelog: get().changelog.filter((c) => c.id !== id) })
  },
}))

export type { DocumentEntityType, NoteEntityType }
