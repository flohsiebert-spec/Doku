import { Badge, type BadgeProps } from '@/components/ui/badge'
import { TICKET_STATUS_LABELS, type TicketStatus } from '@/types'

const STATUS_VARIANT: Record<TicketStatus, NonNullable<BadgeProps['variant']>> = {
  open: 'outline',
  in_progress: 'default',
  waiting: 'warning',
  resolved: 'success',
  closed: 'secondary',
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{TICKET_STATUS_LABELS[status]}</Badge>
}
