import { LayoutGrid, User, Shield, Car, Star, Bell } from "lucide-react"

/**
 * Every tab id the URL may carry.
 *
 * "preferences" stays valid although it no longer has a rail item of its own: the email switches
 * now sit beside the alert feed that they govern, and links to `/account?tab=preferences` are in
 * the wild — in sent email and in customers' bookmarks. It resolves to the alerts panel through
 * TAB_ALIAS below rather than falling through to the default and silently landing somewhere else.
 */
export const VALID_TABS = [
  "overview",
  "personal",
  "security",
  "preferences",
  "bookings",
  "reviews",
  "notifications",
] as const
export type TabId = (typeof VALID_TABS)[number]

/** The panel a tab id renders. Only aliases appear; everything else maps to itself. */
const TAB_ALIAS: Partial<Record<TabId, TabId>> = {
  preferences: "notifications",
}

export const DEFAULT_TAB: TabId = "overview"

/**
 * The tab to render for a URL value, which may be absent, misspelled, or an alias.
 *
 * Callers used to inline `VALID_TABS.includes(x) ? x : "personal"` in three places, which is how
 * the shell and the rail would come to disagree about what is selected.
 */
export function resolveTab(value: string | null | undefined): TabId {
  if (!value || !VALID_TABS.includes(value as TabId)) return DEFAULT_TAB
  const tab = value as TabId
  return TAB_ALIAS[tab] ?? tab
}

export const NAV_ITEMS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "bookings", label: "Trips", icon: Car },
  { id: "personal", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "reviews", label: "Reviews", icon: Star },
]
