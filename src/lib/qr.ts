import type { Device } from '@/types'

/**
 * Encodes a deep link to the device's detail page with its key data base64-embedded
 * in the URL fragment, so scanning the label is useful even fully offline (no
 * server round-trip needed to read name/IP/serial) while still opening the right
 * page if the app happens to be reachable.
 */
export function buildDeviceQrPayload(device: Device, siteName?: string): string {
  const data = {
    id: device.id,
    name: device.name,
    ipv4: device.ipv4,
    serialNumber: device.serialNumber,
    site: siteName ?? '',
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
  return `${window.location.origin}/devices/${device.id}#d=${encoded}`
}
