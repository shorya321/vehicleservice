import { MapPin, Phone, Mail, Clock, LucideIcon } from 'lucide-react'

interface ContactLine {
  text: string
  href?: string
}

interface ContactEntry {
  icon: LucideIcon
  label: string
  lines: ContactLine[]
  muted?: boolean
}

const contactEntries: ContactEntry[] = [
  {
    icon: MapPin,
    label: 'Office',
    lines: [
      { text: 'Business Bay, Dubai' },
      { text: 'United Arab Emirates' },
    ],
  },
  {
    icon: Phone,
    label: 'Phone',
    lines: [
      { text: '+971 50 123 4567', href: 'tel:+971501234567' },
      { text: '+971 4 123 4567', href: 'tel:+97141234567' },
    ],
  },
  {
    icon: Mail,
    label: 'Email',
    lines: [
      { text: 'info@infiniatransfers.com', href: 'mailto:info@infiniatransfers.com' },
      { text: 'bookings@infiniatransfers.com', href: 'mailto:bookings@infiniatransfers.com' },
    ],
  },
  {
    icon: Clock,
    label: 'Hours',
    lines: [
      { text: 'Mon – Fri: 8:00 AM – 10:00 PM' },
      { text: 'Sat – Sun: 9:00 AM – 8:00 PM' },
    ],
    muted: true,
  },
]

function ContactEntryRow({ entry }: { entry: ContactEntry }) {
  const Icon = entry.icon
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-[var(--text-muted)] mt-0.5 shrink-0" />
      <div>
        <p className="text-[0.75rem] font-medium tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5">
          {entry.label}
        </p>
        {entry.lines.map((line) =>
          line.href ? (
            <a
              key={line.text}
              href={line.href}
              className="block text-[0.9375rem] leading-relaxed tracking-[0.01em] text-[var(--text-primary)] hover:text-[var(--gold-text-hover)] rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)] link-underline-grow"
            >
              {line.text}
            </a>
          ) : (
            <p
              key={line.text}
              className={`text-[0.9375rem] leading-relaxed tracking-[0.01em] ${entry.muted ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
            >
              {line.text}
            </p>
          )
        )}
      </div>
    </div>
  )
}

export function ContactInfo() {
  return (
    <div>
      {/* Mobile quick-actions: phone + email */}
      <div className="flex flex-col gap-3 mb-6 lg:hidden">
        <a
          href="tel:+971501234567"
          className="flex items-center justify-center gap-2.5 h-[52px] rounded-[4px] border border-[var(--graphite)] bg-[var(--charcoal)] text-[var(--text-primary)] hover:border-[rgba(var(--gold-rgb),0.3)] hover:text-[var(--gold-text-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)] transition-colors duration-200"
        >
          <Phone className="w-4 h-4" />
          <span className="text-[0.875rem] font-medium">+971 50 123 4567</span>
        </a>
        <a
          href="mailto:info@infiniatransfers.com"
          className="flex items-center justify-center gap-2.5 h-[52px] rounded-[4px] border border-[var(--graphite)] bg-[var(--charcoal)] text-[var(--text-primary)] hover:border-[rgba(var(--gold-rgb),0.3)] hover:text-[var(--gold-text-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)] transition-colors duration-200"
        >
          <Mail className="w-4 h-4" />
          <span className="text-[0.875rem] font-medium">info@infiniatransfers.com</span>
        </a>
      </div>

      {/* Contact detail list — responsive via internal class toggles */}
      <h2 className="hidden lg:block text-[1.125rem] font-medium text-[var(--text-primary)] mb-6 [text-wrap:balance]">
        Contact details
      </h2>
      <div className="divide-y divide-[var(--graphite)]">
        {contactEntries.map((entry) => (
          <div key={entry.label} className="py-4 lg:py-5 first:pt-0 last:pb-0">
            <ContactEntryRow entry={entry} />
          </div>
        ))}
      </div>
    </div>
  )
}
