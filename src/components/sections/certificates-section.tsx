import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ShieldCheck, Pencil, Trash2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { canWrite } from '@/lib/permissions'
import { certSeverity, daysUntil } from '@/lib/certificates'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CertificateFormDialog } from '@/pages/network/CertificateFormDialog'
import type { Certificate } from '@/types'

interface CertificatesSectionProps {
  siteId: string
}

const SEVERITY_BADGE: Record<string, 'destructive' | 'warning' | 'success'> = {
  expired: 'destructive',
  red: 'destructive',
  yellow: 'warning',
  green: 'success',
}

export function CertificatesSection({ siteId }: CertificatesSectionProps) {
  const certificates = useDataStore((s) => s.certificates).filter((c) => c.siteId === siteId)
  const devices = useDataStore((s) => s.devices)
  const deleteCertificate = useDataStore((s) => s.deleteCertificate)
  const canEdit = canWrite(useAuthStore((s) => s.currentUser?.role))

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Certificate | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sorted = certificates.slice().sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime())

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Zertifikate</h3>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Zertifikat anlegen
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
          <ShieldCheck className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine Zertifikate erfasst.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((cert) => {
            const severity = certSeverity(cert.validUntil)
            const days = daysUntil(cert.validUntil)
            const device = devices.find((d) => d.id === cert.deviceId)
            return (
              <div key={cert.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cert.domain}</span>
                    {cert.issuer && <span className="text-xs text-muted-foreground">{cert.issuer}</span>}
                    {device && (
                      <Link to={`/devices/${device.id}`} className="text-xs text-primary hover:underline">
                        {device.name}
                      </Link>
                    )}
                  </div>
                  <div className={cn('text-xs', severity === 'expired' && 'text-destructive')}>
                    {severity === 'expired' ? `Abgelaufen seit ${Math.abs(days)} Tagen` : `Läuft in ${days} Tagen ab`} ·{' '}
                    {formatDate(cert.validUntil)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={SEVERITY_BADGE[severity]}>
                    {severity === 'expired' ? 'Abgelaufen' : severity === 'red' ? 'Kritisch' : severity === 'yellow' ? 'Bald' : 'OK'}
                  </Badge>
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(cert)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(cert.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CertificateFormDialog open={formOpen} onOpenChange={setFormOpen} siteId={siteId} certificate={editing} />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Zertifikat löschen"
        description="Dieses Zertifikat wird unwiderruflich gelöscht."
        onConfirm={() => deleteId && deleteCertificate(deleteId)}
      />
    </div>
  )
}
