'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Users, Luggage, Save, Percent, DollarSign, Copy, RefreshCw } from 'lucide-react'
import { RouteVehicleTypePricing, updateRoutePricing, applyBulkPriceChange } from '../actions'

interface PricingTableProps {
  routeId: string
  routeName: string
  initialPricing: RouteVehicleTypePricing[]
}

export function PricingTable({ routeId, routeName, initialPricing }: PricingTableProps) {
  const router = useRouter()
  const [pricing, setPricing] = useState(initialPricing)
  const [isSaving, setIsSaving] = useState(false)
  const [bulkChangeType, setBulkChangeType] = useState<'percentage' | 'fixed'>('percentage')
  const [bulkChangeValue, setBulkChangeValue] = useState('')

  const handlePriceChange = (vehicleTypeId: string, newPrice: string) => {
    const numericPrice = parseFloat(newPrice) || 0
    setPricing(prev => 
      prev.map(p => 
        p.vehicle_type_id === vehicleTypeId 
          ? { ...p, price: numericPrice }
          : p
      )
    )
  }

  const handleActiveToggle = (vehicleTypeId: string, isActive: boolean) => {
    setPricing(prev => 
      prev.map(p => 
        p.vehicle_type_id === vehicleTypeId 
          ? { ...p, is_active: isActive }
          : p
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates = pricing.map(p => ({
        vehicle_type_id: p.vehicle_type_id,
        price: p.price,
        is_active: p.is_active
      }))

      const result = await updateRoutePricing(routeId, updates)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Pricing updated successfully')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to update pricing')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkChange = async () => {
    if (!bulkChangeValue) {
      toast.error('Please enter a value')
      return
    }

    const value = parseFloat(bulkChangeValue)
    if (isNaN(value)) {
      toast.error('Please enter a valid number')
      return
    }

    setIsSaving(true)
    try {
      const result = await applyBulkPriceChange(routeId, bulkChangeType, value)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Bulk price change applied')
        setBulkChangeValue('')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to apply bulk change')
    } finally {
      setIsSaving(false)
    }
  }

  // Group pricing by category
  const pricingByCategory = pricing.reduce((acc, p) => {
    const categoryName = p.vehicle_type?.category?.name || 'Other'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(p)
    return acc
  }, {} as Record<string, RouteVehicleTypePricing[]>)

  return (
    <div className="space-y-6">
      {/* Bulk Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Price Adjustment</CardTitle>
          <CardDescription>
            Apply percentage or fixed amount changes to all vehicle types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Select value={bulkChangeType} onValueChange={(v) => setBulkChangeType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Percentage Change
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fixed Amount
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder={bulkChangeType === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 5 for $5'}
                value={bulkChangeValue}
                onChange={(e) => setBulkChangeValue(e.target.value)}
                step={bulkChangeType === 'percentage' ? '1' : '0.01'}
              />
            </div>
            <Button 
              onClick={handleBulkChange} 
              disabled={isSaving || !bulkChangeValue}
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply to All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Type Pricing</CardTitle>
          <CardDescription>
            Set individual prices for each vehicle type on the {routeName} route
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(pricingByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">{category}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Price (USD)</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.vehicle_type_id}>
                        <TableCell className="font-medium">
                          {item.vehicle_type?.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {item.vehicle_type?.passenger_capacity}
                            </div>
                            <div className="flex items-center gap-1">
                              <Luggage className="h-3 w-3" />
                              {item.vehicle_type?.luggage_capacity}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => handlePriceChange(item.vehicle_type_id, e.target.value)}
                              className="w-24"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={(checked) => handleActiveToggle(item.vehicle_type_id, checked)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Pricing
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}