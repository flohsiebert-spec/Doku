import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const

/** Locks the app after `autoLockMinutes` of no user activity. 0 disables auto-lock. */
export function useAutoLock() {
  const unlocked = useAuthStore((s) => s.unlocked)
  const autoLockMinutes = useAuthStore((s) => s.autoLockMinutes)

  useEffect(() => {
    if (!unlocked || autoLockMinutes <= 0) return

    let timeoutId: ReturnType<typeof setTimeout>

    function resetTimer() {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        useAuthStore.getState().logout()
      }, autoLockMinutes * 60 * 1000)
    }

    resetTimer()
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true })
    }

    return () => {
      clearTimeout(timeoutId)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [unlocked, autoLockMinutes])
}
