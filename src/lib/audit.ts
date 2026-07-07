import { v4 as uuid } from 'uuid'
import { getDb } from '@/db/database'
import { useAuthStore } from '@/store/authStore'
import type { AuditAction, AuditLogEntry } from '@/types'

const IGNORED_FIELDS = new Set(['id', 'createdAt', 'updatedAt'])

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * Records one audit-log row per changed field. Redacted entity types only log that a
 * field changed, never the actual before/after value (e.g. encrypted passwords).
 */
export async function recordAudit(
  entityType: string,
  entityId: string,
  entityLabel: string,
  action: AuditAction,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  redactFields: string[] = [],
): Promise<void> {
  const user = useAuthStore.getState().currentUser
  const keys = new Set<string>([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])])
  const db = await getDb()
  const timestamp = new Date().toISOString()

  const tx = db.transaction('auditLog', 'readwrite')
  for (const key of keys) {
    if (IGNORED_FIELDS.has(key)) continue
    const oldRaw = before?.[key]
    const newRaw = after?.[key]
    const oldStr = stringifyValue(oldRaw)
    const newStr = stringifyValue(newRaw)
    if (action === 'update' && oldStr === newStr) continue

    const redacted = redactFields.includes(key)
    const entry: AuditLogEntry = {
      id: uuid(),
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: user?.id ?? '',
      username: user?.displayName || user?.username || 'System',
      entityType,
      entityId,
      entityLabel,
      field: key,
      oldValue: redacted ? (oldStr ? '••••••••' : '') : oldStr,
      newValue: redacted ? (newStr ? '••••••••' : '') : newStr,
      action,
    }
    await tx.store.put(entry as never)
  }
  await tx.done
}
