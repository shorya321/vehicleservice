'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Pencil,
  Trash,
  Phone,
  Mail,
  Calendar,
  Shield,
  User,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { VendorDriver, deleteDriver, toggleDriverAvailability, updateDriverStatus } from '../actions'

interface DriversTableProps {
  drivers: VendorDriver[]
  selectable?: boolean
  selectedIds?: string[]
  onSelectDriver?: (id: string, checked: boolean) => void
  onSelectAll?: (checked: boolean) => void
}

export function DriversTable({ drivers: initialDrivers, selectable, selectedIds = [], onSelectDriver, onSelectAll }: DriversTableProps) {
  const router = useRouter()
  const [drivers, setDrivers] = useState(initialDrivers)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')

  // Filter drivers based on search and filters
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      driver.license_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || driver.employment_status === statusFilter
    const matchesAvailability = 
      availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && driver.is_available) ||
      (availabilityFilter === 'unavailable' && !driver.is_available)
    
    return matchesSearch && matchesStatus && matchesAvailability && driver.is_active
  })

  const handleDelete = async (driverId: string) => {
    const result = await deleteDriver(driverId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Driver deleted successfully')
      setDrivers(drivers.filter(d => d.id !== driverId))
    }
  }

  const handleToggleAvailability = async (driverId: string, isAvailable: boolean) => {
    const result = await toggleDriverAvailability(driverId, isAvailable)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Driver marked as ${isAvailable ? 'available' : 'unavailable'}`)
      setDrivers(drivers.map(d => 
        d.id === driverId ? { ...d, is_available: isAvailable } : d
      ))
    }
  }

  const handleStatusChange = async (driverId: string, status: string) => {
    const result = await updateDriverStatus(driverId, status)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Driver status updated')
      setDrivers(drivers.map(d => 
        d.id === driverId ? { ...d, employment_status: status } : d
      ))
      router.refresh()
    }
  }

  const getStatusBadge = (status: string | null | undefined) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Active', variant: 'default' },
      inactive: { label: 'Inactive', variant: 'secondary' },
      on_leave: { label: 'On Leave', variant: 'outline' },
      terminated: { label: 'Terminated', variant: 'destructive' },
    }
    
    const statusInfo = statusMap[status || 'active'] || statusMap.active
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getLicenseTypeBadge = (type: string | null | undefined) => {
    const typeMap: Record<string, { label: string; icon: any }> = {
      regular: { label: 'Regular', icon: User },
      commercial: { label: 'Commercial', icon: Shield },
      heavy: { label: 'Heavy Vehicle', icon: AlertCircle },
    }
    
    const typeInfo = typeMap[type || 'regular'] || typeMap.regular
    const Icon = typeInfo.icon
    
    return (
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        <span className="text-xs">{typeInfo.label}</span>
      </div>
    )
  }

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name, phone, or license..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:max-w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="sm:max-w-[180px]">
            <SelectValue placeholder="Filter by availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === initialDrivers.length && initialDrivers.length > 0}
                    onCheckedChange={(checked) => onSelectAll?.(checked as boolean)}
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectable ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No drivers found
                </TableCell>
              </TableRow>
            ) : (
              filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(driver.id)}
                        onCheckedChange={(checked) => onSelectDriver?.(driver.id, checked as boolean)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {driver.first_name} {driver.last_name}
                      </div>
                      {driver.joining_date && (
                        <div className="text-xs text-muted-foreground">
                          Joined: {format(new Date(driver.joining_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {driver.phone}
                      </div>
                      {driver.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {driver.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-mono text-sm">{driver.license_number}</div>
                      {getLicenseTypeBadge(driver.license_type)}
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span className={cn(
                          isLicenseExpired(driver.license_expiry) && "text-destructive",
                          isLicenseExpiringSoon(driver.license_expiry) && "text-orange-500"
                        )}>
                          {format(new Date(driver.license_expiry), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {isLicenseExpired(driver.license_expiry) && (
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      )}
                      {isLicenseExpiringSoon(driver.license_expiry) && !isLicenseExpired(driver.license_expiry) && (
                        <Badge variant="outline" className="text-xs text-orange-500">Expiring Soon</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={driver.employment_status || 'active'}
                      onValueChange={(value) => handleStatusChange(driver.id, value)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={driver.is_available}
                      onCheckedChange={(checked) => handleToggleAvailability(driver.id, checked)}
                      disabled={driver.employment_status !== 'active'}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/vendor/drivers/${driver.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Driver</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {driver.first_name} {driver.last_name}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(driver.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}