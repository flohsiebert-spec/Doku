import type { UserRole } from '@/types'

export function canWrite(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'technician'
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return role === 'admin'
}

export function canViewSecrets(role: UserRole | undefined): boolean {
  return role !== 'readonly'
}
