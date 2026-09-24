'use client'

import * as React from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { User, LogOut, Star, Building2, Car, LayoutDashboard } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { HeaderProfile } from '@/components/layout/header-profile'

interface AccountMenuProps {
  user: SupabaseUser
  profile: HeaderProfile | null
  initials: string
  onSignOut: () => void
}

/**
 * Row treatment borrowed from the currency selector next to it: 44px rows,
 * one 0.06 gold tint for hover and keyboard focus alike. Radix moves focus to
 * the row under the pointer, so `focus:` covers hover too.
 */
const ROW_CLASS =
  'group min-h-[44px] gap-3 rounded-md px-2.5 text-sm text-[var(--text-primary)] cursor-pointer focus:bg-[rgba(var(--gold-rgb),0.06)] focus:text-[var(--text-primary)]'
const ICON_CLASS =
  'h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors group-focus:text-[var(--gold-text)]'
const SEPARATOR_CLASS = '-mx-1.5 my-1.5 bg-[var(--graphite)]'

const DASHBOARD_PATHS: Record<string, string> = {
  admin: '/admin/dashboard',
  vendor: '/vendor/dashboard',
  business: '/business/dashboard',
}

interface MenuRowProps {
  href: string
  label: string
  icon: LucideIcon
  hint?: string
}

function MenuRow({ href, label, icon: Icon, hint }: MenuRowProps) {
  return (
    <DropdownMenuItem asChild className={ROW_CLASS}>
      <Link href={href}>
        <Icon className={ICON_CLASS} aria-hidden="true" />
        {hint ? (
          <span className="grid py-2 leading-tight">
            <span>{label}</span>
            <span className="text-xs text-[var(--text-muted)]">{hint}</span>
          </span>
        ) : (
          label
        )}
      </Link>
    </DropdownMenuItem>
  )
}

export function AccountMenu({ user, profile, initials, onSignOut }: AccountMenuProps) {
  const isCustomer = !profile?.role || profile.role === 'customer'
  const dashboardPath = profile?.role ? DASHBOARD_PATHS[profile.role] : undefined
  const displayName = profile?.full_name?.trim() || 'User'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Account menu"
          className="hidden lg:inline-flex h-10 w-10 rounded-full border border-[var(--graphite)] hover:border-[var(--gold)] data-[state=open]:border-[var(--gold)] data-[state=open]:shadow-[0_0_0_3px_rgba(var(--gold-rgb),0.12)] transition-[border-color,box-shadow] duration-200"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email} />
            <AvatarFallback className="bg-[var(--charcoal)] text-[var(--gold-text)]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--graphite)] bg-[var(--black-warm)] p-1.5 text-[var(--text-primary)] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-none"
      >
        <DropdownMenuLabel className="flex min-w-0 items-center gap-3 px-2.5 pb-3 pt-2.5 font-normal">
          <Avatar className="h-9 w-9 shrink-0 ring-1 ring-[var(--graphite)]">
            <AvatarImage src={profile?.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-[var(--charcoal)] text-[0.8125rem] font-semibold text-[var(--gold-text)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 gap-0.5">
            <span className="truncate text-sm font-medium leading-snug text-[var(--text-primary)]">
              {displayName}
            </span>
            <span className="truncate text-xs leading-snug text-[var(--text-muted)]" title={user.email}>
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className={SEPARATOR_CLASS} />
        {isCustomer ? (
          <>
            <MenuRow href="/account?tab=personal" label="My Profile" icon={User} />
            <MenuRow href="/account?tab=bookings" label="My Bookings" icon={Car} />
            <MenuRow href="/account?tab=reviews" label="My Reviews" icon={Star} />
            {/* A business action, not part of the account, so it gets its own group. */}
            <DropdownMenuSeparator className={SEPARATOR_CLASS} />
            <MenuRow href="/become-vendor" label="Partner With Us" icon={Building2} hint="List your fleet with us" />
          </>
        ) : dashboardPath ? (
          <MenuRow href={dashboardPath} label="Go to Dashboard" icon={LayoutDashboard} />
        ) : null}
        <DropdownMenuSeparator className={SEPARATOR_CLASS} />
        <DropdownMenuItem
          onClick={onSignOut}
          className="min-h-[44px] gap-3 rounded-md px-2.5 text-sm cursor-pointer text-red-700 dark:text-red-400 focus:text-red-700 dark:focus:text-red-400 focus:bg-red-700/10 dark:focus:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
