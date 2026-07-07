import type { Device } from '@/types'

/** Rack units occupied by a device, given its starting unit (1 = bottom) and height. */
export function unitsFor(device: Device): number[] {
  if (device.rackUnit === null) return []
  const size = device.heSize || 1
  return Array.from({ length: size }, (_, i) => device.rackUnit! + i)
}

export function canPlaceDevice(
  device: Device,
  startUnit: number,
  heightU: number,
  devicesInRack: Device[],
): boolean {
  const size = device.heSize || 1
  if (startUnit < 1 || startUnit + size - 1 > heightU) return false
  const occupied = new Set<number>()
  for (const other of devicesInRack) {
    if (other.id === device.id) continue
    for (const u of unitsFor(other)) occupied.add(u)
  }
  for (let u = startUnit; u < startUnit + size; u++) {
    if (occupied.has(u)) return false
  }
  return true
}
