import { create } from 'zustand'
import {
  decryptString,
  encryptString,
  generateDataKey,
  hasMasterPassword,
  unlockMasterPassword,
  unwrapDataKeyForUser,
  wrapDataKeyForUser,
} from '@/lib/crypto'
import { credentialsRepo, usersRepo } from '@/db/repository'
import type { User, UserRole } from '@/types'

const AUTO_LOCK_KEY = 'doku:auto-lock-minutes'
const DEFAULT_AUTO_LOCK_MINUTES = 15
const LEGACY_SALT_KEY = 'doku:master-salt'
const LEGACY_VERIFY_KEY = 'doku:master-verify'

function getInitialAutoLockMinutes(): number {
  const stored = localStorage.getItem(AUTO_LOCK_KEY)
  const parsed = stored ? Number(stored) : DEFAULT_AUTO_LOCK_MINUTES
  return Number.isFinite(parsed) ? parsed : DEFAULT_AUTO_LOCK_MINUTES
}

interface AuthState {
  booted: boolean
  users: User[]
  currentUser: User | null
  dataKey: CryptoKey | null
  unlocked: boolean
  needsSetup: boolean
  needsMigration: boolean
  error: string | null
  autoLockMinutes: number

  boot: () => Promise<void>
  createFirstAdmin: (username: string, displayName: string, password: string) => Promise<boolean>
  migrateAndCreateFirstAdmin: (
    legacyPassword: string,
    username: string,
    displayName: string,
    newPassword: string,
  ) => Promise<boolean>
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  createUser: (username: string, displayName: string, password: string, role: UserRole) => Promise<boolean>
  updateUserRole: (userId: string, role: UserRole) => Promise<void>
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>
  changeOwnPassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  setAutoLockMinutes: (minutes: number) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  booted: false,
  users: [],
  currentUser: null,
  dataKey: null,
  unlocked: false,
  needsSetup: false,
  needsMigration: false,
  error: null,
  autoLockMinutes: getInitialAutoLockMinutes(),

  boot: async () => {
    const users = await usersRepo.getAll()
    const legacyExists = hasMasterPassword()
    set({
      booted: true,
      users,
      needsSetup: users.length === 0 && !legacyExists,
      needsMigration: users.length === 0 && legacyExists,
    })
  },

  createFirstAdmin: async (username, displayName, password) => {
    if (password.length < 8) {
      set({ error: 'Passwort muss mindestens 8 Zeichen lang sein.' })
      return false
    }
    const dataKey = await generateDataKey()
    const { salt, wrappedDataKey } = await wrapDataKeyForUser(dataKey, password)
    const user = await usersRepo.create({
      username,
      displayName: displayName || username,
      role: 'admin',
      salt,
      wrappedDataKey,
    })
    set((s) => ({
      users: [...s.users, user],
      currentUser: user,
      dataKey,
      unlocked: true,
      needsSetup: false,
      error: null,
    }))
    return true
  },

  migrateAndCreateFirstAdmin: async (legacyPassword, username, displayName, newPassword) => {
    if (newPassword.length < 8) {
      set({ error: 'Passwort muss mindestens 8 Zeichen lang sein.' })
      return false
    }
    const legacyKey = await unlockMasterPassword(legacyPassword)
    if (!legacyKey) {
      set({ error: 'Falsches bisheriges Master-Passwort.' })
      return false
    }
    const dataKey = await generateDataKey()
    const allCredentials = await credentialsRepo.getAll()
    for (const cred of allCredentials) {
      const plain = await decryptString(cred.encryptedPassword, legacyKey)
      const reencrypted = await encryptString(plain, dataKey)
      await credentialsRepo.update(cred.id, { encryptedPassword: reencrypted })
    }
    const { salt, wrappedDataKey } = await wrapDataKeyForUser(dataKey, newPassword)
    const user = await usersRepo.create({
      username,
      displayName: displayName || username,
      role: 'admin',
      salt,
      wrappedDataKey,
    })
    localStorage.removeItem(LEGACY_SALT_KEY)
    localStorage.removeItem(LEGACY_VERIFY_KEY)
    set((s) => ({
      users: [...s.users, user],
      currentUser: user,
      dataKey,
      unlocked: true,
      needsSetup: false,
      needsMigration: false,
      error: null,
    }))
    return true
  },

  login: async (username, password) => {
    const user = get().users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase())
    if (!user) {
      set({ error: 'Unbekannter Benutzer.' })
      return false
    }
    const dataKey = await unwrapDataKeyForUser(user.wrappedDataKey, user.salt, password)
    if (!dataKey) {
      set({ error: 'Falsches Passwort.' })
      return false
    }
    set({ currentUser: user, dataKey, unlocked: true, error: null })
    return true
  },

  logout: () => set({ unlocked: false, currentUser: null, dataKey: null }),

  createUser: async (username, displayName, password, role) => {
    const { dataKey, users } = get()
    if (!dataKey) return false
    if (password.length < 8) {
      set({ error: 'Passwort muss mindestens 8 Zeichen lang sein.' })
      return false
    }
    if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      set({ error: 'Benutzername bereits vergeben.' })
      return false
    }
    const { salt, wrappedDataKey } = await wrapDataKeyForUser(dataKey, password)
    const user = await usersRepo.create({ username, displayName: displayName || username, role, salt, wrappedDataKey })
    set((s) => ({ users: [...s.users, user], error: null }))
    return true
  },

  updateUserRole: async (userId, role) => {
    const updated = await usersRepo.update(userId, { role })
    set((s) => ({ users: s.users.map((u) => (u.id === userId ? updated : u)) }))
  },

  resetUserPassword: async (userId, newPassword) => {
    const { dataKey } = get()
    if (!dataKey) return
    const { salt, wrappedDataKey } = await wrapDataKeyForUser(dataKey, newPassword)
    const updated = await usersRepo.update(userId, { salt, wrappedDataKey })
    set((s) => ({ users: s.users.map((u) => (u.id === userId ? updated : u)) }))
  },

  changeOwnPassword: async (oldPassword, newPassword) => {
    const { currentUser } = get()
    if (!currentUser) return false
    if (newPassword.length < 8) {
      set({ error: 'Neues Passwort muss mindestens 8 Zeichen lang sein.' })
      return false
    }
    const verifiedKey = await unwrapDataKeyForUser(currentUser.wrappedDataKey, currentUser.salt, oldPassword)
    if (!verifiedKey) {
      set({ error: 'Aktuelles Passwort ist falsch.' })
      return false
    }
    const { salt, wrappedDataKey } = await wrapDataKeyForUser(verifiedKey, newPassword)
    const updated = await usersRepo.update(currentUser.id, { salt, wrappedDataKey })
    set((s) => ({
      users: s.users.map((u) => (u.id === currentUser.id ? updated : u)),
      currentUser: updated,
      error: null,
    }))
    return true
  },

  deleteUser: async (userId) => {
    const { users, currentUser } = get()
    if (userId === currentUser?.id) return false
    const remainingAdmins = users.filter((u) => u.role === 'admin' && u.id !== userId)
    const target = users.find((u) => u.id === userId)
    if (target?.role === 'admin' && remainingAdmins.length === 0) return false
    await usersRepo.remove(userId)
    set((s) => ({ users: s.users.filter((u) => u.id !== userId) }))
    return true
  },

  setAutoLockMinutes: (minutes: number) => {
    localStorage.setItem(AUTO_LOCK_KEY, String(minutes))
    set({ autoLockMinutes: minutes })
  },
}))
