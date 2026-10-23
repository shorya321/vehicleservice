"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar, navGroups } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"
import { NavigationProgressProvider } from "./navigation-progress/navigation-progress-provider"
import { TopProgressBar } from "./navigation-progress/top-progress-bar"
import { ContentLoader } from "./navigation-progress/content-loader"
import { flattenNavLabels } from "./navigation-progress/classify-navigation"
import { useScrollbarReveal } from "@/lib/hooks/use-scrollbar-reveal"

const ADMIN_NAV_LABELS = flattenNavLabels(navGroups)

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useScrollbarReveal()
  // Close the mobile drawer whenever the route changes. Adjusting state during
  // render (rather than in an effect) is React's documented pattern for this.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setSidebarOpen(false)
  }
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <NavigationProgressProvider navLabels={ADMIN_NAV_LABELS}>
      <TopProgressBar />
      <div className="relative flex h-screen overflow-hidden">
        <div
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden",
            sidebarOpen ? "block" : "hidden"
          )}
          onClick={closeSidebar}
        />

        <aside
          onKeyDown={(e) => {
            if (e.key === "Escape" && sidebarOpen) closeSidebar()
          }}
          // Close the drawer as soon as a link is tapped, so the page loader
          // underneath is visible while the next page loads.
          onClick={(e) => {
            if (sidebarOpen && e.target instanceof Element && e.target.closest("a[href]")) closeSidebar()
          }}
          className={cn(
            "fixed left-0 z-[60] h-full transition-[transform,visibility] md:visible md:relative md:z-50 md:translate-x-0",
            // invisible (not just off-screen) keeps the closed drawer's links out of
            // the tab order and the accessibility tree on mobile
            sidebarOpen ? "visible translate-x-0" : "invisible -translate-x-full"
          )}
        >
          <Sidebar />
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          {/* text-luxury-lightGray (#7a7672, the default for shared table cells) is 4.3:1
              on the admin background, under AA. Inside the admin only, map it to the
              theme-aware muted foreground. Shared components stay untouched. */}
          <div className="relative isolate flex min-h-0 flex-1 flex-col">
            <main role="main" aria-label="Main content" className="flex-1 overflow-y-auto bg-background [&_.text-luxury-lightGray]:text-muted-foreground">
              <div className="w-full px-4 py-6 md:px-6 lg:px-8">
                {children}
              </div>
            </main>
            <ContentLoader />
          </div>
        </div>
      </div>
    </NavigationProgressProvider>
  )
}
