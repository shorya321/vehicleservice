'use client'

/**
 * Admin Live Preview Component
 * Real-time preview of theme colors showing mini admin portal mockup
 *
 * SCOPE: Admin module ONLY
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  Car,
  Settings,
  ChevronRight,
  Bell,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  card: string
  sidebar: string
  textPrimary: string
  textSecondary: string
  border: string
}

interface AdminLivePreviewProps {
  darkColors: PreviewColors
  lightColors: PreviewColors
  activeMode: 'dark' | 'light'
  className?: string
}

export function AdminLivePreview({
  darkColors,
  lightColors,
  activeMode,
  className,
}: AdminLivePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'dark' | 'light'>(activeMode)

  const colors = previewMode === 'dark' ? darkColors : lightColors

  return (
    <Card className={cn("overflow-hidden border border-border", className)}>
      {/* Preview Mode Toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Live Preview
        </span>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreviewMode('dark')}
            className={cn(
              "h-7 px-3 text-xs transition-all",
              previewMode === 'dark'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Moon className="w-3 h-3 mr-1.5" />
            Dark
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreviewMode('light')}
            className={cn(
              "h-7 px-3 text-xs transition-all",
              previewMode === 'light'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun className="w-3 h-3 mr-1.5" />
            Light
          </Button>
        </div>
      </div>

      {/* Mini Admin Portal Preview */}
      <div
        className="relative flex h-[360px] transition-colors duration-300"
        style={{ backgroundColor: colors.background }}
      >
        {/* Mini Sidebar */}
        <div
          className="w-16 flex-shrink-0 flex flex-col items-center py-4 gap-3 border-r transition-colors duration-300"
          style={{
            backgroundColor: colors.sidebar,
            borderColor: colors.border,
          }}
        >
          {/* Logo placeholder */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: colors.primary,
              color: previewMode === 'dark' ? '#09090B' : '#FFFFFF',
            }}
          >
            AD
          </div>

          {/* Nav items */}
          <div className="flex flex-col items-center gap-2 mt-2">
            {[LayoutDashboard, Users, Car, Settings].map((Icon, i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300",
                  i === 0 ? "ring-1" : ""
                )}
                style={{
                  backgroundColor: i === 0 ? `${colors.primary}20` : 'transparent',
                  color: i === 0 ? colors.primary : colors.textSecondary,
                  ...(i === 0 ? { ringColor: `${colors.primary}40` } : {}),
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mini Header */}
          <div
            className="h-12 flex items-center justify-between px-4 border-b transition-colors duration-300"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <span
              className="text-sm font-medium transition-colors duration-300"
              style={{ color: colors.textPrimary }}
            >
              Admin Dashboard
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
              >
                <Bell className="w-3 h-3" />
              </div>
              <div
                className="w-6 h-6 rounded-full transition-colors duration-300"
                style={{ backgroundColor: colors.primary }}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Users', value: '1,234', icon: Users },
                { label: 'Bookings', value: '567', icon: Car },
                { label: 'Revenue', value: '$45K', icon: TrendingUp },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border transition-colors duration-300"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon
                      className="w-3 h-3"
                      style={{ color: colors.secondary }}
                    />
                    <span
                      className="text-[9px] uppercase tracking-wider transition-colors duration-300"
                      style={{ color: colors.textSecondary }}
                    >
                      {stat.label}
                    </span>
                  </div>
                  <div
                    className="text-base font-semibold transition-colors duration-300"
                    style={{ color: colors.textPrimary }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button Preview */}
            <button
              className="w-full py-2.5 rounded-lg text-xs font-medium transition-colors duration-300 flex items-center justify-center gap-1"
              style={{
                backgroundColor: colors.primary,
                color: previewMode === 'dark' ? '#09090B' : '#FFFFFF',
              }}
            >
              Manage Users
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Table Preview */}
            <div
              className="rounded-lg border transition-colors duration-300"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              {/* Table Header */}
              <div
                className="px-3 py-2 border-b flex gap-4 transition-colors duration-300"
                style={{ borderColor: colors.border }}
              >
                <span
                  className="text-[9px] uppercase tracking-wider font-medium flex-1 transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  User
                </span>
                <span
                  className="text-[9px] uppercase tracking-wider font-medium w-16 transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Status
                </span>
              </div>

              {/* Table Rows */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "px-3 py-2 flex items-center gap-4 transition-colors duration-300",
                    i !== 3 ? "border-b" : ""
                  )}
                  style={{
                    borderColor: i !== 3 ? colors.border : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-5 h-5 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: `${colors.secondary}30` }}
                    />
                    <div>
                      <div
                        className="text-[10px] font-medium transition-colors duration-300"
                        style={{ color: colors.textPrimary }}
                      >
                        User #{i}
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-[9px] px-1.5 py-0.5 rounded-full w-16 text-center transition-colors duration-300"
                    style={{
                      backgroundColor: i === 1 ? `${colors.accent}20` : `${colors.secondary}20`,
                      color: i === 1 ? colors.accent : colors.secondary,
                    }}
                  >
                    {i === 1 ? 'Active' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
