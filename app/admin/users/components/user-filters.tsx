"use client"

import { useState } from "react"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UserFilters, UserRole, UserStatus } from "@/lib/types/user"
import { Filter, X, ChevronDown, Shield, Mail, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface UserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
}

export function UserFiltersComponent({ filters, onFiltersChange }: UserFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null)
  const [hasSignedIn, setHasSignedIn] = useState<boolean | null>(null)

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handleRoleChange = (role: string) => {
    onFiltersChange({ ...filters, role: role as UserRole | "all", page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as UserStatus | "all", page: 1 })
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    setEmailVerified(null)
    setTwoFactorEnabled(null)
    setHasSignedIn(null)
    onFiltersChange({ 
      page: 1, 
      limit: filters.limit || 10,
      role: 'all',
      status: 'all'
    })
  }

  const handleApplyAdvancedFilters = () => {
    const newFilters: any = { ...filters, page: 1 }
    
    if (emailVerified !== null) {
      newFilters.emailVerified = emailVerified
    }
    if (twoFactorEnabled !== null) {
      newFilters.twoFactorEnabled = twoFactorEnabled
    }
    if (hasSignedIn !== null) {
      newFilters.hasSignedIn = hasSignedIn
    }
    
    onFiltersChange(newFilters)
    setAdvancedOpen(false)
  }

  const activeFilterCount = [
    filters.search,
    filters.role && filters.role !== "all" ? filters.role : null,
    filters.status && filters.status !== "all" ? filters.status : null,
    (filters as any).emailVerified !== undefined,
    (filters as any).twoFactorEnabled !== undefined,
    (filters as any).hasSignedIn !== undefined,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <SearchInput
          placeholder="Search by name, email, or phone..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onSearch={handleSearchSubmit}
          className="max-w-sm"
        />
        
        <Select value={filters.role || "all"} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
            >
              <Filter className="mr-2 h-4 w-4" />
              Advanced
              {activeFilterCount > 3 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1">
                  {activeFilterCount - 3}
                </Badge>
              )}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm">Advanced Filters</h4>
                <p className="text-xs text-muted-foreground">
                  Filter users by additional criteria
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email-verified" className="text-sm">
                      Email Verified
                    </Label>
                  </div>
                  <Select
                    value={emailVerified === null ? "all" : emailVerified ? "yes" : "no"}
                    onValueChange={(value) => 
                      setEmailVerified(value === "all" ? null : value === "yes")
                    }
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="2fa-enabled" className="text-sm">
                      2FA Enabled
                    </Label>
                  </div>
                  <Select
                    value={twoFactorEnabled === null ? "all" : twoFactorEnabled ? "yes" : "no"}
                    onValueChange={(value) => 
                      setTwoFactorEnabled(value === "all" ? null : value === "yes")
                    }
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="has-signed-in" className="text-sm">
                      Has Signed In
                    </Label>
                  </div>
                  <Select
                    value={hasSignedIn === null ? "all" : hasSignedIn ? "yes" : "no"}
                    onValueChange={(value) => 
                      setHasSignedIn(value === "all" ? null : value === "yes")
                    }
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEmailVerified(null)
                    setTwoFactorEnabled(null)
                    setHasSignedIn(null)
                  }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyAdvancedFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Clear All
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}