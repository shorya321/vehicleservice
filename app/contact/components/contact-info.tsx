import { MapPin, Mail, Phone, Clock, ArrowRight, LucideIcon } from 'lucide-react'

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

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]'

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
    icon: Mail,
    label: 'Email',
    lines: [
      { text: 'info@infiniatransfers.com', href: 'mailto:info@infiniatransfers.com' },
    ],
  },
  {
    icon: Phone,
    label: 'Phone',
    lines: [
      { text: '+971 50 123 4567', href: 'tel:+971501234567' },
    ],
  },
  {
    icon: Clock,
    label: 'Hours',
    lines: [
      { text: 'Available 24/7' },
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
              className={`block text-[0.9375rem] leading-relaxed tracking-[0.01em] text-[var(--text-primary)] hover:text-[var(--gold-text-hover)] rounded-[2px] link-underline-grow ${FOCUS_RING}`}
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

function SideCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--stub-line)] rounded-[12px] p-6">
      <h3 className="text-[0.625rem] font-bold tracking-[0.2em] uppercase text-[var(--gold-text)] mb-2.5">
        {label}
      </h3>
      {children}
    </div>
  )
}

export function ContactInfo() {
  return (
    <div>
      {/* Mobile quick-action: email */}
      <div className="flex flex-col gap-3 mb-6 lg:hidden">
        <a
          href="mailto:info@infiniatransfers.com"
          className={`flex items-center justify-center gap-2.5 h-[52px] rounded-[4px] border border-[var(--graphite)] bg-[var(--charcoal)] text-[var(--text-primary)] hover:border-[rgba(var(--gold-rgb),0.3)] hover:text-[var(--gold-text-hover)] transition-colors duration-200 ${FOCUS_RING}`}
        >
          <Mail className="w-4 h-4" />
          <span className="text-[0.875rem] font-medium">info@infiniatransfers.com</span>
        </a>
      </div>

      {/* Contact detail list. Responsive via internal class toggles */}
      <h2 className="hidden lg:block text-[1.25rem] font-semibold text-[var(--text-primary)] mb-6 [text-wrap:balance]">
        Contact details
      </h2>
      <div className="divide-y divide-[var(--graphite)]">
        {contactEntries.map((entry) => (
          <div key={entry.label} className="py-4 lg:py-5 first:pt-0 last:pb-0">
            <ContactEntryRow entry={entry} />
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3.5">
        <SideCard label="Travelling today">
          <p className="text-[0.875rem] leading-[1.65] tracking-[0.01em] text-[var(--text-secondary)] mb-[1.125rem] [text-wrap:pretty]">
            If your pickup is inside the next 12 hours, call the desk instead of writing. We
            track your flight and hold the car for 45 minutes after you land.
          </p>
          <a
            href="tel:+971501234567"
            className={`btn btn-secondary gap-3 px-[1.375rem] py-3 rounded-[8px] tracking-[0.01em] normal-case ${FOCUS_RING}`}
          >
            Call the desk
            <ArrowRight className="w-4 h-4" />
          </a>
        </SideCard>

        <SideCard label="Corporate accounts">
          <p className="text-[0.875rem] leading-[1.65] tracking-[0.01em] text-[var(--text-secondary)] [text-wrap:pretty]">
            Monthly invoicing, priority booking and a named account manager. Pick Corporate
            Services in the form and we set it up in one call.
          </p>
        </SideCard>
      </div>
    </div>
  )
}
