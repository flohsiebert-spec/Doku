import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Embedded/sandboxed contexts (e.g. a preview iframe) can silently swallow a
 * programmatic <a download> click, and depending on the host's sandbox flags a
 * `window.open()` popup may be blocked instead. Since a blocked download fails
 * silently either way, try both in that case: whichever mechanism the host
 * allows gets the file to the user. Top-level pages keep the direct download.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  let inIframe = true
  try {
    inIframe = window.self !== window.top
  } catch {
    inIframe = true
  }

  if (inIframe) {
    window.open(url, '_blank')
  }

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Delay revocation so a slower-loading popup tab still gets to read the blob.
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
