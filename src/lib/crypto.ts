const SALT_KEY = 'doku:master-salt'
const VERIFY_KEY = 'doku:master-verify'
const VERIFY_PLAINTEXT = 'it-doku-master-password-check'

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 250_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(plaintext),
  )
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return bufToBase64(combined.buffer)
}

export async function decryptString(payload: string, key: CryptoKey): Promise<string> {
  const combined = new Uint8Array(base64ToBuf(payload))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  )
  return new TextDecoder().decode(plainBuf)
}

export function hasMasterPassword(): boolean {
  return localStorage.getItem(SALT_KEY) !== null && localStorage.getItem(VERIFY_KEY) !== null
}

/** Returns the current master salt (base64) so backups can embed it for portable decryption. */
export function getCurrentSaltB64(): string | null {
  return localStorage.getItem(SALT_KEY)
}

/** Derives a key from a password and an explicit base64 salt (used for restoring backups). */
export async function deriveKeyFromSaltB64(password: string, saltB64: string): Promise<CryptoKey> {
  const salt = new Uint8Array(base64ToBuf(saltB64))
  return deriveKey(password, salt)
}

/** Sets up a brand-new master password (first run) and returns the derived session key. */
export async function setupMasterPassword(password: string): Promise<CryptoKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(password, salt)
  const verifyToken = await encryptString(VERIFY_PLAINTEXT, key)
  localStorage.setItem(SALT_KEY, bufToBase64(salt.buffer))
  localStorage.setItem(VERIFY_KEY, verifyToken)
  return key
}

/** Attempts to unlock with an existing master password. Returns the key on success, null on wrong password. */
export async function unlockMasterPassword(password: string): Promise<CryptoKey | null> {
  const saltB64 = localStorage.getItem(SALT_KEY)
  const verifyToken = localStorage.getItem(VERIFY_KEY)
  if (!saltB64 || !verifyToken) return null
  const salt = new Uint8Array(base64ToBuf(saltB64))
  const key = await deriveKey(password, salt)
  try {
    const plain = await decryptString(verifyToken, key)
    if (plain !== VERIFY_PLAINTEXT) return null
    return key
  } catch {
    return null
  }
}

export async function changeMasterPassword(
  oldPassword: string,
  newPassword: string,
  reencrypt: (oldKey: CryptoKey, newKey: CryptoKey) => Promise<void>,
): Promise<boolean> {
  const oldKey = await unlockMasterPassword(oldPassword)
  if (!oldKey) return false
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const newKey = await deriveKey(newPassword, salt)
  await reencrypt(oldKey, newKey)
  const verifyToken = await encryptString(VERIFY_PLAINTEXT, newKey)
  localStorage.setItem(SALT_KEY, bufToBase64(salt.buffer))
  localStorage.setItem(VERIFY_KEY, verifyToken)
  return true
}

export function generatePassword(options: {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}): string {
  const sets = {
    uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lowercase: 'abcdefghijkmnopqrstuvwxyz',
    numbers: '23456789',
    symbols: '!@#$%^&*()-_=+[]{}?',
  }
  let charset = ''
  if (options.uppercase) charset += sets.uppercase
  if (options.lowercase) charset += sets.lowercase
  if (options.numbers) charset += sets.numbers
  if (options.symbols) charset += sets.symbols
  if (!charset) charset = sets.lowercase + sets.numbers

  const randomValues = crypto.getRandomValues(new Uint32Array(options.length))
  let result = ''
  for (let i = 0; i < options.length; i++) {
    result += charset[randomValues[i] % charset.length]
  }
  return result
}
