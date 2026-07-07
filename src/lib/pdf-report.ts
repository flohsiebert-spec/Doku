import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ChangelogEntry, Device, Doc, Site } from '@/types'
import { DEVICE_TYPES } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import { daysUntil } from '@/lib/certificates'

const LOGO_KEY = 'doku:report-logo'

export function getReportLogo(): string | null {
  return localStorage.getItem(LOGO_KEY)
}
export function setReportLogo(dataUrl: string) {
  localStorage.setItem(LOGO_KEY, dataUrl)
}
export function clearReportLogo() {
  localStorage.removeItem(LOGO_KEY)
}

export interface DecryptedCredential {
  title: string
  username: string
  password: string
  url: string
}

/**
 * Embedded/sandboxed contexts (e.g. a preview iframe) can silently swallow the
 * programmatic <a download> click that jsPDF's `.save()` relies on, and depending
 * on the host's sandbox flags a `window.open()` popup may be blocked instead.
 * Since a blocked download fails silently either way, try both: whichever
 * mechanism the host allows gets the PDF to the user.
 */
function savePdf(doc: jsPDF, filename: string) {
  let inIframe = true
  try {
    inIframe = window.self !== window.top
  } catch {
    inIframe = true
  }

  if (!inIframe) {
    doc.save(filename)
    return
  }

  const blobUrl = doc.output('bloburl')
  window.open(blobUrl.toString(), '_blank')
  doc.save(filename)
}

function addCoverPage(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const logo = getReportLogo()
  let y = 70

  if (logo) {
    try {
      doc.addImage(logo, pageWidth / 2 - 20, 35, 40, 40)
      y = 95
    } catch {
      // ignore malformed logo data
    }
  }

  doc.setFontSize(22)
  doc.setTextColor(20)
  doc.text(title, pageWidth / 2, y, { align: 'center' })

  if (subtitle) {
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(subtitle, pageWidth / 2, y + 10, { align: 'center' })
  }

  doc.setFontSize(10)
  doc.setTextColor(140)
  doc.text(`Erstellt am ${formatDateTime(new Date().toISOString())}`, pageWidth / 2, pageHeight - 25, {
    align: 'center',
  })
  doc.text('IT-Doku', pageWidth / 2, pageHeight - 18, { align: 'center' })
}

function addFootersAndPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('IT-Doku', 14, pageHeight - 10)
    doc.text(`Seite ${i - 1} von ${pageCount - 1}`, pageWidth - 14, pageHeight - 10, { align: 'right' })
  }
}

function sectionTitle(doc: jsPDF, title: string) {
  doc.setFontSize(14)
  doc.setTextColor(20)
  doc.text(title, 14, 20)
}

function deviceRows(devices: Device[], includeSite: boolean, sites?: Site[]) {
  return devices.map((d) => {
    const base = [
      d.name,
      DEVICE_TYPES.find((t) => t.value === d.type)?.label ?? d.type,
      d.ipv4,
      d.mac,
      d.manufacturer,
      d.model,
      d.serialNumber,
    ]
    if (includeSite && sites) {
      return [...base, sites.find((s) => s.id === d.siteId)?.name ?? '']
    }
    return base
  })
}

export function generateSiteReport(params: {
  site: Site
  devices: Device[]
  documents: Doc[]
  changelog: ChangelogEntry[]
  credentials?: DecryptedCredential[]
}) {
  const { site, devices, documents, changelog, credentials } = params
  const doc = new jsPDF()

  addCoverPage(doc, `Standort-Report`, site.name)

  doc.addPage()
  sectionTitle(doc, `Geräte (${devices.length})`)
  autoTable(doc, {
    startY: 26,
    head: [['Name', 'Typ', 'IPv4', 'MAC', 'Hersteller', 'Modell', 'Seriennummer']],
    body: deviceRows(devices, false),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 60, 120] },
  })

  if (credentials && credentials.length > 0) {
    doc.addPage()
    sectionTitle(doc, `Zugangsdaten (${credentials.length})`)
    autoTable(doc, {
      startY: 26,
      head: [['Titel', 'Benutzername', 'Passwort', 'URL']],
      body: credentials.map((c) => [c.title, c.username, c.password, c.url]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [150, 40, 40] },
    })
  }

  doc.addPage()
  sectionTitle(doc, `Dokumente (${documents.length})`)
  autoTable(doc, {
    startY: 26,
    head: [['Name', 'Tags', 'Aktuelle Version', 'Hochgeladen']],
    body: documents.map((d) => {
      const latest = d.versions[d.versions.length - 1]
      return [d.name, d.tags.join(', '), `v${latest?.version ?? 1}`, formatDate(latest?.uploadedAt)]
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 60, 120] },
  })

  doc.addPage()
  sectionTitle(doc, `Änderungsprotokoll (${changelog.length})`)
  autoTable(doc, {
    startY: 26,
    head: [['Datum', 'Beschreibung', 'Techniker']],
    body: changelog
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((c) => [formatDate(c.date), c.description, c.technician]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 60, 120] },
  })

  addFootersAndPageNumbers(doc)
  savePdf(doc, `standort-report-${site.name}.pdf`)
}

export function generateInventoryReport(devices: Device[], sites: Site[]) {
  const doc = new jsPDF()
  addCoverPage(doc, 'Inventar-Report', `${devices.length} Geräte über ${sites.length} Standorte`)

  doc.addPage()
  sectionTitle(doc, 'Geräteinventar')
  autoTable(doc, {
    startY: 26,
    head: [['Name', 'Typ', 'IPv4', 'MAC', 'Hersteller', 'Modell', 'Seriennummer', 'Standort']],
    body: deviceRows(devices, true, sites),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [40, 60, 120] },
  })

  addFootersAndPageNumbers(doc)
  savePdf(doc, 'inventar-report.pdf')
}

export function generateWarrantyReport(devices: Device[], sites: Site[]) {
  const withWarranty = devices
    .filter((d) => d.warrantyUntil)
    .sort((a, b) => new Date(a.warrantyUntil).getTime() - new Date(b.warrantyUntil).getTime())

  const doc = new jsPDF()
  addCoverPage(doc, 'Garantie-Report', `${withWarranty.length} Geräte mit Garantiedatum, sortiert nach Dringlichkeit`)

  doc.addPage()
  sectionTitle(doc, 'Garantien')
  autoTable(doc, {
    startY: 26,
    head: [['Gerät', 'Standort', 'Modell', 'Kaufdatum', 'Garantie bis', 'Status']],
    body: withWarranty.map((d) => {
      const days = daysUntil(d.warrantyUntil)
      const status = days < 0 ? `Abgelaufen (${Math.abs(days)}d)` : `${days} Tage verbleibend`
      return [
        d.name,
        sites.find((s) => s.id === d.siteId)?.name ?? '',
        d.model,
        formatDate(d.purchaseDate),
        formatDate(d.warrantyUntil),
        status,
      ]
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 60, 120] },
  })

  addFootersAndPageNumbers(doc)
  savePdf(doc, 'garantie-report.pdf')
}
