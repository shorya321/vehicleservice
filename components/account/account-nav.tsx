import { User, Shield, Settings, Car, Star, Bell } from "lucide-react"

export const VALID_TABS = ["personal", "security", "preferences", "bookings", "reviews", "notifications"] as const
export type TabId = (typeof VALID_TABS)[number]

export const NAV_ITEMS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "bookings", label: "Bookings", icon: Car },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "notifications", label: "Notifications", icon: Bell },
]
