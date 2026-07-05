export interface SubnetInfo {
  cidr: string
  networkInt: number
  prefix: number
  totalAddresses: number
  usableAddresses: number
  firstHostInt: number
  lastHostInt: number
}

export function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) return null
  let result = 0
  for (const part of parts) {
    const n = Number(part)
    if (!Number.isInteger(n) || n < 0 || n > 255) return null
    result = result * 256 + n
  }
  return result >>> 0
}

export function intToIp(n: number): string {
  return [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255].join('.')
}

export function parseCidr(cidr: string): SubnetInfo | null {
  const [ipPart, prefixPart] = cidr.trim().split('/')
  const networkInt = ipToInt(ipPart)
  const prefix = Number(prefixPart)
  if (networkInt === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null
  const totalAddresses = 2 ** (32 - prefix)
  const maskedNetwork = prefix === 0 ? 0 : (networkInt & (~0 << (32 - prefix))) >>> 0
  const usableAddresses = totalAddresses > 2 ? totalAddresses - 2 : totalAddresses
  const firstHostInt = totalAddresses > 2 ? maskedNetwork + 1 : maskedNetwork
  const lastHostInt = totalAddresses > 2 ? maskedNetwork + totalAddresses - 2 : maskedNetwork + totalAddresses - 1
  return {
    cidr,
    networkInt: maskedNetwork,
    prefix,
    totalAddresses,
    usableAddresses,
    firstHostInt,
    lastHostInt,
  }
}

export function isIpInSubnet(ip: string, subnet: SubnetInfo): boolean {
  const ipInt = ipToInt(ip)
  if (ipInt === null) return false
  return ipInt >= subnet.networkInt && ipInt < subnet.networkInt + subnet.totalAddresses
}
