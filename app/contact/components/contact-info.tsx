import { MapPin, Phone, Mail, Clock } from 'lucide-react'

const contactCards = [
  {
    icon: MapPin,
    title: 'Our Office',
    lines: ['Business Bay, Dubai', 'United Arab Emirates'],
    href: null,
  },
  {
    icon: Phone,
    title: 'Phone',
    lines: ['+971 50 123 4567', '+971 4 123 4567'],
    href: 'tel:+971501234567',
  },
  {
    icon: Mail,
    title: 'Email',
    lines: ['info@infiniatransfers.com', 'bookings@infiniatransfers.com'],
    href: 'mailto:info@infiniatransfers.com',
  },
  {
    icon: Clock,
    title: 'Business Hours',
    lines: ['Mon - Fri: 8:00 AM - 10:00 PM', 'Sat - Sun: 9:00 AM - 8:00 PM'],
    href: null,
  },
]

export function ContactInfo() {
  return (
    <div className="space-y-4">
      {contactCards.map((card) => {
        const Icon = card.icon
        const Wrapper = card.href ? 'a' : 'div'
        const wrapperProps = card.href
          ? { href: card.href, target: '_blank' as const, rel: 'noopener noreferrer' }
          : {}

        return (
          <Wrapper
            key={card.title}
            {...wrapperProps}
            className="luxury-card luxury-card-hover block p-6 group cursor-default"
            style={card.href ? { cursor: 'pointer' } : undefined}
          >
            <div className="flex items-start gap-4">
              <div className="benefit-icon shrink-0">
                <Icon className="w-5 h-5 text-[var(--gold)]" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  {card.title}
                </h4>
                {card.lines.map((line) => (
                  <p key={line} className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </Wrapper>
        )
      })}
    </div>
  )
}
