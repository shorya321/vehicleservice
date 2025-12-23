'use client'

/**
 * Live Preview Component
 * Real-time preview of branding colors showing mini portal mockup
 *
 * SCOPE: Business module ONLY
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sun, Moon, LayoutDashboard, CreditCard, Calendar, Settings, ChevronRight, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewColors {
  // Accent colors
  primary: string
  secondary: string
  accent: string
  // Mode-specific colors
  background: string
  surface: string
  sidebar: string
  textPrimary: string
  textSecondary: string
  border: string
}

interface LivePreviewProps {
  darkColors: PreviewColors
  lightColors: PreviewColors
  brandName?: string
  className?: string
}

export function LivePreview({ darkColors, lightColors, brandName = 'Your Brand', className }: LivePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'dark' | 'light'>('dark')

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

      {/* Mini Portal Preview */}
      <div
        className="relative flex h-[320px] transition-colors duration-300"
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
            {brandName.substring(0, 2).toUpperCase()}
          </div>

          {/* Nav items */}
          <div className="flex flex-col items-center gap-2 mt-2">
            {[LayoutDashboard, CreditCard, Calendar, Settings].map((Icon, i) => (
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
              Dashboard
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
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Balance', value: '$2,450' },
                { label: 'Bookings', value: '24' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border transition-colors duration-300"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <span
                    className="text-[10px] uppercase tracking-wider transition-colors duration-300"
                    style={{ color: colors.textSecondary }}
                  >
                    {stat.label}
                  </span>
                  <div
                    className="text-lg font-semibold mt-0.5 transition-colors duration-300"
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
              New Booking
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* List Preview */}
            <div
              className="rounded-lg border transition-colors duration-300"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "px-3 py-2.5 flex items-center justify-between transition-colors duration-300",
                    i === 1 ? "" : "border-b"
                  )}
                  style={{
                    borderColor: i === 1 ? 'transparent' : colors.border,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded transition-colors duration-300"
                      style={{ backgroundColor: `${colors.secondary}30` }}
                    />
                    <div>
                      <div
                        className="text-xs font-medium transition-colors duration-300"
                        style={{ color: colors.textPrimary }}
                      >
                        Booking #{i}234
                      </div>
                      <div
                        className="text-[10px] transition-colors duration-300"
                        style={{ color: colors.textSecondary }}
                      >
                        Airport Transfer
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-[10px] px-2 py-0.5 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: `${colors.accent}20`,
                      color: colors.accent,
                    }}
                  >
                    Active
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
