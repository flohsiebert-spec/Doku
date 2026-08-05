import { Badge, type BadgeProps } from '@/components/ui/badge'
import { TICKET_PRIORITY_LABELS, type TicketPriority } from '@/types'

const PRIORITY_VARIANT: Record<TicketPriority, NonNullable<BadgeProps['variant']>> = {
  low: 'outline',
  medium: 'secondary',
  high: 'warning',
  critical: 'destructive',
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{TICKET_PRIORITY_LABELS[priority]}</Badge>
}
