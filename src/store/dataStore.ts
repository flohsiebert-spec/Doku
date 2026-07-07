import { create } from 'zustand'
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
} from '@/db/repository'
import { blobKey } from '@/types'
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
  vlans: Vlan[]
  cables: Cable[]
  racks: Rack[]
  dnsEntries: DnsEntry[]
  certificates: Certificate[]

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

  createVlan: (data: Omit<Vlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vlan>
  updateVlan: (id: string, data: Partial<Vlan>) => Promise<void>
  deleteVlan: (id: string) => Promise<void>

  createCable: (data: Omit<Cable, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Cable>
  updateCable: (id: string, data: Partial<Cable>) => Promise<void>
  deleteCable: (id: string) => Promise<void>

  createRack: (data: Omit<Rack, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Rack>
  updateRack: (id: string, data: Partial<Rack>) => Promise<void>
  deleteRack: (id: string) => Promise<void>

  createDnsEntry: (data: Omit<DnsEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DnsEntry>
  updateDnsEntry: (id: string, data: Partial<DnsEntry>) => Promise<void>
  deleteDnsEntry: (id: string) => Promise<void>

  createCertificate: (data: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Certificate>
  updateCertificate: (id: string, data: Partial<Certificate>) => Promise<void>
  deleteCertificate: (id: string) => Promise<void>
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
  vlans: [],
  cables: [],
  racks: [],
  dnsEntries: [],
  certificates: [],

  loadAll: async () => {
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
      vlans,
      cables,
      racks,
      dnsEntries,
      certificates,
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
      ...get().vlans.filter((v) => v.siteId === id).map((v) => vlansRepo.remove(v.id)),
      ...get().cables.filter((c) => c.siteId === id).map((c) => cablesRepo.remove(c.id)),
      ...get().racks.filter((r) => r.siteId === id).map((r) => racksRepo.remove(r.id)),
      ...get().dnsEntries.filter((d) => d.siteId === id).map((d) => dnsEntriesRepo.remove(d.id)),
      ...get().certificates.filter((c) => c.siteId === id).map((c) => certificatesRepo.remove(c.id)),
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
      vlans: get().vlans.filter((v) => v.siteId !== id),
      cables: get().cables.filter((c) => c.siteId !== id),
      racks: get().racks.filter((r) => r.siteId !== id),
      dnsEntries: get().dnsEntries.filter((d) => d.siteId !== id),
      certificates: get().certificates.filter((c) => c.siteId !== id),
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
      ...get()
        .cables.filter((c) => c.fromDeviceId === id || c.toDeviceId === id)
        .map((c) => cablesRepo.remove(c.id)),
      ...get().certificates.filter((c) => c.deviceId === id).map((c) => certificatesRepo.remove(c.id)),
    ])
    set({
      devices: get().devices.filter((d) => d.id !== id),
      credentials: get().credentials.filter((c) => c.deviceId !== id),
      documents: get().documents.filter((doc) => doc.deviceId !== id),
      notes: get().notes.filter((n) => n.deviceId !== id),
      changelog: get().changelog.filter((c) => c.deviceId !== id),
      cables: get().cables.filter((c) => c.fromDeviceId !== id && c.toDeviceId !== id),
      certificates: get().certificates.filter((c) => c.deviceId !== id),
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
    const doc = get().documents.find((d) => d.id === id)
    await documentsRepo.remove(id)
    if (doc) {
      await Promise.all(doc.versions.map((v) => documentBlobsRepo.remove(blobKey(id, v.version))))
    }
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

  createVlan: async (data) => {
    const vlan = await vlansRepo.create(data)
    set({ vlans: [...get().vlans, vlan] })
    return vlan
  },
  updateVlan: async (id, data) => {
    const updated = await vlansRepo.update(id, data)
    set({ vlans: get().vlans.map((v) => (v.id === id ? updated : v)) })
  },
  deleteVlan: async (id) => {
    await vlansRepo.remove(id)
    await Promise.all(get().cables.filter((c) => c.vlanId === id).map((c) => cablesRepo.update(c.id, { vlanId: '' })))
    set({
      vlans: get().vlans.filter((v) => v.id !== id),
      cables: get().cables.map((c) => (c.vlanId === id ? { ...c, vlanId: '' } : c)),
    })
  },

  createCable: async (data) => {
    const cable = await cablesRepo.create(data)
    set({ cables: [...get().cables, cable] })
    return cable
  },
  updateCable: async (id, data) => {
    const updated = await cablesRepo.update(id, data)
    set({ cables: get().cables.map((c) => (c.id === id ? updated : c)) })
  },
  deleteCable: async (id) => {
    await cablesRepo.remove(id)
    set({ cables: get().cables.filter((c) => c.id !== id) })
  },

  createRack: async (data) => {
    const rack = await racksRepo.create(data)
    set({ racks: [...get().racks, rack] })
    return rack
  },
  updateRack: async (id, data) => {
    const updated = await racksRepo.update(id, data)
    set({ racks: get().racks.map((r) => (r.id === id ? updated : r)) })
  },
  deleteRack: async (id) => {
    await racksRepo.remove(id)
    const affectedDevices = get().devices.filter((d) => d.rackId === id)
    await Promise.all(affectedDevices.map((d) => devicesRepo.update(d.id, { rackId: '', rackUnit: null })))
    set({
      racks: get().racks.filter((r) => r.id !== id),
      devices: get().devices.map((d) => (d.rackId === id ? { ...d, rackId: '', rackUnit: null } : d)),
    })
  },

  createDnsEntry: async (data) => {
    const entry = await dnsEntriesRepo.create(data)
    set({ dnsEntries: [...get().dnsEntries, entry] })
    return entry
  },
  updateDnsEntry: async (id, data) => {
    const updated = await dnsEntriesRepo.update(id, data)
    set({ dnsEntries: get().dnsEntries.map((d) => (d.id === id ? updated : d)) })
  },
  deleteDnsEntry: async (id) => {
    await dnsEntriesRepo.remove(id)
    set({ dnsEntries: get().dnsEntries.filter((d) => d.id !== id) })
  },

  createCertificate: async (data) => {
    const cert = await certificatesRepo.create(data)
    set({ certificates: [...get().certificates, cert] })
    return cert
  },
  updateCertificate: async (id, data) => {
    const updated = await certificatesRepo.update(id, data)
    set({ certificates: get().certificates.map((c) => (c.id === id ? updated : c)) })
  },
  deleteCertificate: async (id) => {
    await certificatesRepo.remove(id)
    set({ certificates: get().certificates.filter((c) => c.id !== id) })
  },
}))
