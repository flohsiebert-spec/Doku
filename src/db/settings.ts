import type { AppSettings } from '@/types'
import { getDb } from './db'

const SETTINGS_ID = 'app-settings'

export async function getAppSettings(): Promise<AppSettings | undefined> {
  const db = await getDb()
  return db.get('settings', SETTINGS_ID)
}

export async function putAppSettings(settings: AppSettings): Promise<void> {
  const db = await getDb()
  await db.put('settings', settings)
}
