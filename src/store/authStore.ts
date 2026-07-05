import { create } from 'zustand'
import { hasMasterPassword, setupMasterPassword, unlockMasterPassword } from '@/lib/crypto'

interface AuthState {
  unlocked: boolean
  hasMaster: boolean
  key: CryptoKey | null
  error: string | null
  refreshHasMaster: () => void
  setup: (password: string) => Promise<boolean>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  unlocked: false,
  hasMaster: hasMasterPassword(),
  key: null,
  error: null,
  refreshHasMaster: () => set({ hasMaster: hasMasterPassword() }),
  setup: async (password: string) => {
    if (password.length < 8) {
      set({ error: 'Master-Passwort muss mindestens 8 Zeichen lang sein.' })
      return false
    }
    const key = await setupMasterPassword(password)
    set({ key, unlocked: true, hasMaster: true, error: null })
    return true
  },
  unlock: async (password: string) => {
    const key = await unlockMasterPassword(password)
    if (!key) {
      set({ error: 'Falsches Master-Passwort.' })
      return false
    }
    set({ key, unlocked: true, error: null })
    return true
  },
  lock: () => set({ unlocked: false, key: null }),
}))
