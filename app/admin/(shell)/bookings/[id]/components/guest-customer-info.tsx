import { Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface GuestPassenger {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  is_primary: boolean | null
}

interface GuestCustomerInfoProps {
  guestEmail: string
  passengers: GuestPassenger[] | null | undefined
}

/**
 * Customer card body for a booking made at guest checkout: there is no account, so the
 * contact is the lead passenger and the email the guest booked with.
 */
export function GuestCustomerInfo({ guestEmail, passengers }: GuestCustomerInfoProps) {
  const lead = passengers?.find((p) => p.is_primary) ?? passengers?.[0]
  const name = `${lead?.first_name ?? ''} ${lead?.last_name ?? ''}`.trim() || 'Guest'
  const email = lead?.email || guestEmail

  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium">{name}</p>
          <Badge>Guest</Badge>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{email}</span>
        </div>
        {lead?.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{lead.phone}</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Booked without an account. It moves into an account once someone signs up and verifies this email.
        </p>
      </div>
    </>
  )
}
