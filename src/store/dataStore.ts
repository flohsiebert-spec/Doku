import { create } from 'zustand'
import {
  changelogRepo,
  credentialsRepo,
  devicesRepo,
  documentsRepo,
  notesRepo,
  roomsRepo,
  siteImagesRepo,
  sitesRepo,
} from '@/db/repository'
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

interface DataState {
  loaded: boolean
  sites: Site[]
  rooms: Room[]
  siteImages: SiteImage[]
  devices: Device[]
  credentials: Credential[]
  documents: Doc[]
  notes: Note[]
  changelog: ChangelogEntry[]

  loadAll: () => Promise<void>

  createSite: (data: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Site>
  updateSite: (id: string, data: Partial<Site>) => Promise<void>
  deleteSite: (id: string) => Promise<void>

  createRoom: (data: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Room>
  updateRoom: (id: string, data: Partial<Room>) => Promise<void>
  deleteRoom: (id: string) => Promise<void>

  createSiteImage: (data: Omit<SiteImage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SiteImage>
  deleteSiteImage: (id: string) => Promise<void>

  createDevice: (data: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Device>
  updateDevice: (id: string, data: Partial<Device>) => Promise<void>
  deleteDevice: (id: string) => Promise<void>

  createCredential: (data: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Credential>
  updateCredential: (id: string, data: Partial<Credential>) => Promise<void>
  deleteCredential: (id: string) => Promise<void>

  createDocument: (data: Omit<Doc, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Doc>
  updateDocument: (id: string, data: Partial<Doc>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>

  createNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>
  updateNote: (id: string, data: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>

  createChangelogEntry: (
    data: Omit<ChangelogEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<ChangelogEntry>
  deleteChangelogEntry: (id: string) => Promise<void>
}

export const useDataStore = create<DataState>((set, get) => ({
  loaded: false,
  sites: [],
  rooms: [],
  siteImages: [],
  devices: [],
  credentials: [],
  documents: [],
  notes: [],
  changelog: [],

  loadAll: async () => {
    const [sites, rooms, siteImages, devices, credentials, documents, notes, changelog] =
      await Promise.all([
        sitesRepo.getAll(),
        roomsRepo.getAll(),
        siteImagesRepo.getAll(),
        devicesRepo.getAll(),
        credentialsRepo.getAll(),
        documentsRepo.getAll(),
        notesRepo.getAll(),
        changelogRepo.getAll(),
      ])
    set({
      loaded: true,
      sites,
      rooms,
      siteImages,
      devices,
      credentials,
      documents,
      notes,
      changelog,
    })
  },

  createSite: async (data) => {
    const site = await sitesRepo.create(data)
    set({ sites: [...get().sites, site] })
    return site
  },
  updateSite: async (id, data) => {
    const updated = await sitesRepo.update(id, data)
    set({ sites: get().sites.map((s) => (s.id === id ? updated : s)) })
  },
  deleteSite: async (id) => {
    await sitesRepo.remove(id)
    const roomIds = get().rooms.filter((r) => r.siteId === id).map((r) => r.id)
    const deviceIds = get().devices.filter((d) => d.siteId === id).map((d) => d.id)
    await Promise.all([
      ...get().rooms.filter((r) => r.siteId === id).map((r) => roomsRepo.remove(r.id)),
      ...get().siteImages.filter((i) => i.siteId === id).map((i) => siteImagesRepo.remove(i.id)),
      ...get().devices.filter((d) => d.siteId === id).map((d) => devicesRepo.remove(d.id)),
      ...get().credentials.filter((c) => c.siteId === id).map((c) => credentialsRepo.remove(c.id)),
      ...get().documents.filter((doc) => doc.siteId === id).map((doc) => documentsRepo.remove(doc.id)),
      ...get().notes.filter((n) => n.siteId === id).map((n) => notesRepo.remove(n.id)),
      ...get().changelog.filter((c) => c.siteId === id).map((c) => changelogRepo.remove(c.id)),
    ])
    set({
      sites: get().sites.filter((s) => s.id !== id),
      rooms: get().rooms.filter((r) => !roomIds.includes(r.id)),
      siteImages: get().siteImages.filter((i) => i.siteId !== id),
      devices: get().devices.filter((d) => !deviceIds.includes(d.id)),
      credentials: get().credentials.filter((c) => c.siteId !== id),
      documents: get().documents.filter((doc) => doc.siteId !== id),
      notes: get().notes.filter((n) => n.siteId !== id),
      changelog: get().changelog.filter((c) => c.siteId !== id),
    })
  },

  createRoom: async (data) => {
    const room = await roomsRepo.create(data)
    set({ rooms: [...get().rooms, room] })
    return room
  },
  updateRoom: async (id, data) => {
    const updated = await roomsRepo.update(id, data)
    set({ rooms: get().rooms.map((r) => (r.id === id ? updated : r)) })
  },
  deleteRoom: async (id) => {
    await roomsRepo.remove(id)
    const affectedDevices = get().devices.filter((d) => d.roomId === id)
    await Promise.all(affectedDevices.map((d) => devicesRepo.update(d.id, { roomId: '' })))
    set({
      rooms: get().rooms.filter((r) => r.id !== id),
      devices: get().devices.map((d) => (d.roomId === id ? { ...d, roomId: '' } : d)),
    })
  },

  createSiteImage: async (data) => {
    const image = await siteImagesRepo.create(data)
    set({ siteImages: [...get().siteImages, image] })
    return image
  },
  deleteSiteImage: async (id) => {
    await siteImagesRepo.remove(id)
    set({ siteImages: get().siteImages.filter((i) => i.id !== id) })
  },

  createDevice: async (data) => {
    const device = await devicesRepo.create(data)
    set({ devices: [...get().devices, device] })
    return device
  },
  updateDevice: async (id, data) => {
    const updated = await devicesRepo.update(id, data)
    set({ devices: get().devices.map((d) => (d.id === id ? updated : d)) })
  },
  deleteDevice: async (id) => {
    await devicesRepo.remove(id)
    await Promise.all([
      ...get().credentials.filter((c) => c.deviceId === id).map((c) => credentialsRepo.remove(c.id)),
      ...get().documents.filter((doc) => doc.deviceId === id).map((doc) => documentsRepo.remove(doc.id)),
      ...get().notes.filter((n) => n.deviceId === id).map((n) => notesRepo.remove(n.id)),
      ...get().changelog.filter((c) => c.deviceId === id).map((c) => changelogRepo.remove(c.id)),
    ])
    set({
      devices: get().devices.filter((d) => d.id !== id),
      credentials: get().credentials.filter((c) => c.deviceId !== id),
      documents: get().documents.filter((doc) => doc.deviceId !== id),
      notes: get().notes.filter((n) => n.deviceId !== id),
      changelog: get().changelog.filter((c) => c.deviceId !== id),
    })
  },

  createCredential: async (data) => {
    const credential = await credentialsRepo.create(data)
    set({ credentials: [...get().credentials, credential] })
    return credential
  },
  updateCredential: async (id, data) => {
    const updated = await credentialsRepo.update(id, data)
    set({ credentials: get().credentials.map((c) => (c.id === id ? updated : c)) })
  },
  deleteCredential: async (id) => {
    await credentialsRepo.remove(id)
    set({ credentials: get().credentials.filter((c) => c.id !== id) })
  },

  createDocument: async (data) => {
    const doc = await documentsRepo.create(data)
    set({ documents: [...get().documents, doc] })
    return doc
  },
  updateDocument: async (id, data) => {
    const updated = await documentsRepo.update(id, data)
    set({ documents: get().documents.map((d) => (d.id === id ? updated : d)) })
  },
  deleteDocument: async (id) => {
    await documentsRepo.remove(id)
    set({ documents: get().documents.filter((d) => d.id !== id) })
  },

  createNote: async (data) => {
    const note = await notesRepo.create(data)
    set({ notes: [...get().notes, note] })
    return note
  },
  updateNote: async (id, data) => {
    const updated = await notesRepo.update(id, data)
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) })
  },
  deleteNote: async (id) => {
    await notesRepo.remove(id)
    set({ notes: get().notes.filter((n) => n.id !== id) })
  },

  createChangelogEntry: async (data) => {
    const entry = await changelogRepo.create(data)
    set({ changelog: [...get().changelog, entry] })
    return entry
  },
  deleteChangelogEntry: async (id) => {
    await changelogRepo.remove(id)
    set({ changelog: get().changelog.filter((c) => c.id !== id) })
  },
}))
