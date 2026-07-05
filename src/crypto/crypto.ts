import type { EncryptedPayload } from '@/types'

const PBKDF2_ITERATIONS = 210_000
const CHECK_PLAINTEXT = 'doku-master-password-check-v1'

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export function generateSaltB64(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return bufToB64(salt.buffer)
}

export async function deriveKey(masterPassword: string, saltB64: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: b64ToBuf(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptString(key: CryptoKey, plaintext: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )
  return {
    ciphertext: bufToB64(ciphertext),
    iv: bufToB64(iv.buffer),
  }
}

export async function decryptString(key: CryptoKey, payload: EncryptedPayload): Promise<string> {
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuf(payload.iv) },
    key,
    b64ToBuf(payload.ciphertext),
  )
  return new TextDecoder().decode(plainBuf)
}

export async function createCheckPayload(key: CryptoKey): Promise<EncryptedPayload> {
  return encryptString(key, CHECK_PLAINTEXT)
}

export async function verifyCheckPayload(key: CryptoKey, payload: EncryptedPayload): Promise<boolean> {
  try {
    const plain = await decryptString(key, payload)
    return plain === CHECK_PLAINTEXT
  } catch {
    return false
  }
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
    symbols: '!@#$%^&*()-_=+[]{}',
  }
  let pool = ''
  if (options.uppercase) pool += sets.uppercase
  if (options.lowercase) pool += sets.lowercase
  if (options.numbers) pool += sets.numbers
  if (options.symbols) pool += sets.symbols
  if (!pool) pool = sets.lowercase + sets.numbers

  const randomValues = crypto.getRandomValues(new Uint32Array(options.length))
  let password = ''
  for (let i = 0; i < options.length; i++) {
    password += pool[randomValues[i] % pool.length]
  }
  return password
}
