'use client'

import { motion, type Variants } from 'motion/react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

export type MenuItemVariant = 'default' | 'danger' | 'phone'

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

/* Rows run full bleed to both drawer edges so the press wash reads as a band
   rather than a floating pill. The 16px inset plus a fixed 20px icon box plus
   the 12px gap puts every label on one 48px axis whatever the glyph's own
   width: a wide Car and a narrow User used to land in different places. */
const ROW_BASE =
  'group relative flex w-full items-center gap-3 px-4 py-3 min-h-[48px] text-left text-[15px] font-body ' +
  'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-inset focus-visible:ring-[var(--gold)]'

/* Every wash goes through an `-rgb` companion token. Tailwind 3 cannot apply an
   opacity modifier to an arbitrary var() colour: `bg-[var(--gold)]/5` compiles
   to no rule at all, which is why none of these states rendered before. */
const TONE: Record<MenuItemVariant, string> = {
  default:
    'text-[var(--text-secondary)] hover:text-[var(--gold-text)] ' +
    'hover:bg-[rgba(var(--gold-rgb),0.05)] active:bg-[rgba(var(--gold-rgb),0.09)]',
  phone:
    'text-[var(--text-secondary)] hover:text-[var(--gold-text)] ' +
    'hover:bg-[rgba(var(--gold-rgb),0.05)] active:bg-[rgba(var(--gold-rgb),0.09)]',
  /* --destructive holds a bare HSL triplet, so `color: var(--destructive)` is
     invalid and the row silently inherited grey. --destructive-rgb exists for
     exactly this. */
  danger:
    'text-[rgb(var(--destructive-rgb))] hover:bg-[rgba(var(--destructive-rgb),0.1)] ' +
    'active:bg-[rgba(var(--destructive-rgb),0.16)]',
}

/* The current page is the only place besides the booking CTA where gold appears
   at full strength. Matches the desktop header, which has had an active state
   all along. */
const ACTIVE_TONE = 'text-[var(--gold-text)] font-medium bg-[rgba(var(--gold-rgb),0.045)]'

function rowClass(variant: MenuItemVariant, active: boolean, separated: boolean): string {
  return [
    ROW_BASE,
    active ? ACTIVE_TONE : TONE[variant],
    separated ? 'mt-2 border-t border-[rgba(var(--gold-rgb),0.08)] pt-4' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

interface RowContentProps {
  icon: LucideIcon
  label: string
  variant: MenuItemVariant
  active: boolean
}

function RowContent({ icon: Icon, label, variant, active }: RowContentProps) {
  const iconTone = variant === 'phone' && !active ? 'text-[var(--gold-text)]' : ''
  const labelTone =
    variant === 'phone'
      ? 'text-[17px] tabular-nums tracking-[0.01em] text-[var(--text-primary)] ' +
        'transition-colors duration-200 group-hover:text-[var(--gold-text)]'
      : ''

  return (
    <>
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[22px] w-[2px] -translate-y-1/2 rounded-r-sm bg-[var(--gold)]"
        />
      )}
      <span className="flex w-5 shrink-0 items-center justify-center">
        <Icon
          className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ${iconTone}`}
          strokeWidth={1.6}
        />
      </span>
      <span className={labelTone}>{label}</span>
    </>
  )
}

interface MenuNavItemProps {
  href: string
  label: string
  icon: LucideIcon
  onClick?: () => void
  reducedMotion?: boolean
  variant?: MenuItemVariant
  active?: boolean
  separated?: boolean
}

export function MenuNavItem({
  href,
  label,
  icon,
  onClick,
  reducedMotion,
  variant = 'default',
  active = false,
  separated = false,
}: MenuNavItemProps) {
  const className = rowClass(variant, active, separated)
  const content = <RowContent icon={icon} label={label} variant={variant} active={active} />

  if (href.startsWith('#') || href.startsWith('/#') || href.startsWith('tel:')) {
    return (
      <motion.a
        href={href}
        className={className}
        onClick={onClick}
        variants={reducedMotion ? undefined : itemVariants}
      >
        {content}
      </motion.a>
    )
  }

  return (
    <motion.div variants={reducedMotion ? undefined : itemVariants}>
      <Link
        href={href}
        className={className}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
      >
        {content}
      </Link>
    </motion.div>
  )
}

interface MenuButtonItemProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  reducedMotion?: boolean
  variant?: MenuItemVariant
  active?: boolean
  separated?: boolean
}

export function MenuButtonItem({
  label,
  icon,
  onClick,
  reducedMotion,
  variant = 'default',
  active = false,
  separated = false,
}: MenuButtonItemProps) {
  return (
    <motion.button
      type="button"
      className={rowClass(variant, active, separated)}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      variants={reducedMotion ? undefined : itemVariants}
    >
      <RowContent icon={icon} label={label} variant={variant} active={active} />
    </motion.button>
  )
}
