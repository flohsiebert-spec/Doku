import { create } from 'zustand'
import {
  createCheckPayload,
  deriveKey,
  generateSaltB64,
  verifyCheckPayload,
} from '@/crypto/crypto'
import { getAppSettings, putAppSettings } from '@/db/settings'

interface AuthState {
  initialized: boolean
  hasMasterPassword: boolean
  unlocked: boolean
  key: CryptoKey | null
  error: string | null
  init: () => Promise<void>
  setup: (password: string) => Promise<void>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  hasMasterPassword: false,
  unlocked: false,
  key: null,
  error: null,

  init: async () => {
    const settings = await getAppSettings()
    set({
      initialized: true,
      hasMasterPassword: !!settings?.passwordCheckPayload,
    })
  },

  setup: async (password: string) => {
    const saltB64 = generateSaltB64()
    const key = await deriveKey(password, saltB64)
    const checkPayload = await createCheckPayload(key)
    await putAppSettings({
      id: 'app-settings',
      theme: 'system',
      passwordSaltB64: saltB64,
      passwordCheckPayload: checkPayload,
    })
    set({ hasMasterPassword: true, unlocked: true, key, error: null })
  },

  unlock: async (password: string) => {
    const settings = await getAppSettings()
    if (!settings?.passwordCheckPayload) {
      set({ error: 'Kein Master-Passwort eingerichtet.' })
      return false
    }
    const key = await deriveKey(password, settings.passwordSaltB64)
    const valid = await verifyCheckPayload(key, settings.passwordCheckPayload)
    if (!valid) {
      set({ error: 'Falsches Master-Passwort.' })
      return false
    }
    set({ unlocked: true, key, error: null })
    return true
  },

  lock: () => set({ unlocked: false, key: null }),
}))
