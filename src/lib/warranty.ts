import type { Device } from '@/types'

/** Devices whose warranty expires within the next `days` days (including already-expired ones from today). */
export function getExpiringWarranties(devices: Device[], days = 90): Device[] {
  const now = new Date()
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  return devices
    .filter((d) => d.warrantyUntil)
    .filter((d) => {
      const until = new Date(d.warrantyUntil)
      return until.getTime() <= horizon.getTime()
    })
    .sort((a, b) => new Date(a.warrantyUntil).getTime() - new Date(b.warrantyUntil).getTime())
}

export function isWarrantyExpired(warrantyUntil: string): boolean {
  return new Date(warrantyUntil).getTime() < Date.now()
}
