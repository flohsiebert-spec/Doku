import type { Certificate } from '@/types'

export type CertSeverity = 'expired' | 'red' | 'yellow' | 'green'

export function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export function certSeverity(validUntil: string): CertSeverity {
  const days = daysUntil(validUntil)
  if (days < 0) return 'expired'
  if (days < 30) return 'red'
  if (days < 60) return 'yellow'
  return 'green'
}

export function getExpiringCertificates(certs: Certificate[], days = 90): Certificate[] {
  return certs
    .filter((c) => c.validUntil && daysUntil(c.validUntil) <= days)
    .sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime())
}
