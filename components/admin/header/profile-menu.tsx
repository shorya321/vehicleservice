"use client"

import * as React from "react"
import Link from "next/link"
import { LogOut, User, type LucideIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initialsFor } from "@/lib/portal-header/controls"

export interface ProfileMenuLink {
  href: string
  label: string
  icon: LucideIcon
}

interface ProfileMenuProps {
  name: string | null | undefined
  email: string | null | undefined
  avatarUrl: string | null | undefined
  roleLabel: string
  fallbackName: string
  links: ProfileMenuLink[]
  onSignOut: () => void
}

/** Header profile button and its account menu, shared by admin and vendor. */
export function ProfileMenu({
  name,
  email,
  avatarUrl,
  roleLabel,
  fallbackName,
  links,
  onSignOut,
}: ProfileMenuProps) {
  const displayName = name?.trim() || fallbackName
  const initials = initialsFor(name, email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hdr-btn h-9 w-9" aria-label="Account menu">
          {avatarUrl ? (
            <Avatar className="h-[26px] w-[26px] rounded-[7px]">
              <AvatarImage src={avatarUrl} alt="" className="object-cover" />
              <AvatarFallback className="hdr-face rounded-[7px]">{initials}</AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} collisionPadding={16} className="hdr-menu w-[272px] p-0">
        <div className="hdr-menu__who">
          <Avatar className="h-10 w-10 shrink-0 rounded-[10px]">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
            <AvatarFallback className="hdr-menu__initials rounded-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="hdr-menu__name">{displayName}</span>
            {email ? <span className="hdr-menu__mail">{email}</span> : null}
            <span className="hdr-menu__role">{roleLabel}</span>
          </div>
        </div>
        <DropdownMenuSeparator className="hdr-menu__sep" />
        <div className="hdr-menu__items">
          {links.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild className="hdr-menu__item">
              <Link href={href}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="hdr-menu__sep" />
        <div className="hdr-menu__items">
          <DropdownMenuItem onSelect={onSignOut} className="hdr-menu__item text-destructive">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
