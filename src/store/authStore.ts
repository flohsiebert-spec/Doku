import { create } from 'zustand'
import { hasMasterPassword, setupMasterPassword, unlockMasterPassword } from '@/lib/crypto'

const AUTO_LOCK_KEY = 'doku:auto-lock-minutes'
const DEFAULT_AUTO_LOCK_MINUTES = 15

function getInitialAutoLockMinutes(): number {
  const stored = localStorage.getItem(AUTO_LOCK_KEY)
  const parsed = stored ? Number(stored) : DEFAULT_AUTO_LOCK_MINUTES
  return Number.isFinite(parsed) ? parsed : DEFAULT_AUTO_LOCK_MINUTES
}

interface AuthState {
  unlocked: boolean
  hasMaster: boolean
  key: CryptoKey | null
  error: string | null
  autoLockMinutes: number
  refreshHasMaster: () => void
  setup: (password: string) => Promise<boolean>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
  setAutoLockMinutes: (minutes: number) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  unlocked: false,
  hasMaster: hasMasterPassword(),
  key: null,
  error: null,
  autoLockMinutes: getInitialAutoLockMinutes(),
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
  setAutoLockMinutes: (minutes: number) => {
    localStorage.setItem(AUTO_LOCK_KEY, String(minutes))
    set({ autoLockMinutes: minutes })
  },
}))
