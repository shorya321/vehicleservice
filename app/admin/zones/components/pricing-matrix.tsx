'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Zone, updateZonePricing } from '../actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface PricingMatrixProps {
  zones: Zone[]
  pricingMap: Map<string, number>
}

export function PricingMatrix({ zones, pricingMap: initialPricingMap }: PricingMatrixProps) {
  const router = useRouter()
  const [pricingMap, setPricingMap] = useState<Map<string, number>>(initialPricingMap)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [changedCells, setChangedCells] = useState<Set<string>>(new Set())

  const activeZones = zones.filter(z => z.is_active)

  const getCellKey = (fromId: string, toId: string) => {
    return `${fromId}|${toId}`
  }

  const getPrice = (fromId: string, toId: string) => {
    return pricingMap.get(getCellKey(fromId, toId)) || 0
  }

  const handleCellClick = (fromId: string, toId: string) => {
    const cellKey = getCellKey(fromId, toId)
    setEditingCell(cellKey)
    setTempValue(getPrice(fromId, toId).toString())
  }

  const handleCellBlur = async (fromId: string, toId: string) => {
    const cellKey = getCellKey(fromId, toId)
    const newPrice = parseFloat(tempValue)

    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Price must be a valid positive number')
      setEditingCell(null)
      return
    }

    const oldPrice = getPrice(fromId, toId)
    if (oldPrice !== newPrice) {
      setPricingMap(new Map(pricingMap.set(cellKey, newPrice)))
      setChangedCells(new Set(changedCells.add(cellKey)))
    }

    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, fromId: string, toId: string) => {
    if (e.key === 'Enter') {
      handleCellBlur(fromId, toId)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const saveAllChanges = async () => {
    if (changedCells.size === 0) {
      toast.info('No pricing changes to save')
      return
    }

    setSaving(true)

    const updates = Array.from(changedCells).map(cellKey => {
      const [fromId, toId] = cellKey.split('|')
      const price = pricingMap.get(cellKey) || 0
      
      // Find zone names for better error messages
      const fromZone = zones.find(z => z.id === fromId)
      const toZone = zones.find(z => z.id === toId)
      
      return {
        cellKey,
        fromId,
        toId,
        price,
        fromName: fromZone?.name || 'Unknown',
        toName: toZone?.name || 'Unknown'
      }
    })

    try {
      const results = await Promise.all(
        updates.map(async (update) => {
          const result = await updateZonePricing(update.fromId, update.toId, update.price)
          return {
            ...update,
            ...result
          }
        })
      )

      const errors = results.filter(r => r.error)
      const successes = results.filter(r => !r.error)

      if (errors.length > 0) {
        // Show detailed error messages
        errors.forEach(err => {
          toast.error(`Failed: ${err.fromName} → ${err.toName}: ${err.error}`)
        })
        
        // Remove successful updates from changedCells
        successes.forEach(s => {
          changedCells.delete(s.cellKey)
        })
        setChangedCells(new Set(changedCells))
      } else {
        toast.success(`${changedCells.size} pricing update(s) saved successfully`)
        setChangedCells(new Set())
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save pricing changes:', error)
      toast.error('An unexpected error occurred while saving pricing changes')
    }

    setSaving(false)
  }

  const getDiagonalColor = (fromId: string, toId: string) => {
    if (fromId === toId) {
      return 'bg-muted/50'
    }
    return ''
  }

  return (
    <div className="space-y-4">
      {changedCells.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium">
              You have {changedCells.size} unsaved pricing change(s)
            </span>
          </div>
          <Button onClick={saveAllChanges} disabled={saving} size="sm">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-background">From \ To</TableHead>
              {activeZones.map(zone => (
                <TableHead key={zone.id} className="text-center min-w-[100px]">
                  {zone.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeZones.map(fromZone => (
              <TableRow key={fromZone.id}>
                <TableCell className="sticky left-0 z-10 bg-background font-medium">
                  {fromZone.name}
                </TableCell>
                {activeZones.map(toZone => {
                  const cellKey = getCellKey(fromZone.id, toZone.id)
                  const isEditing = editingCell === cellKey
                  const price = getPrice(fromZone.id, toZone.id)
                  const hasChanged = changedCells.has(cellKey)

                  return (
                    <TableCell
                      key={toZone.id}
                      className={cn(
                        'text-center cursor-pointer hover:bg-muted/50 transition-colors',
                        getDiagonalColor(fromZone.id, toZone.id),
                        hasChanged && 'bg-yellow-50 dark:bg-yellow-950'
                      )}
                      onClick={() => !isEditing && handleCellClick(fromZone.id, toZone.id)}
                    >
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => handleCellBlur(fromZone.id, toZone.id)}
                          onKeyDown={(e) => handleKeyDown(e, fromZone.id, toZone.id)}
                          className="w-20 h-8 mx-auto"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={cn(
                          'font-mono',
                          hasChanged && 'font-semibold text-yellow-600 dark:text-yellow-400'
                        )}>
                          ${price.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Click on any cell to edit the base price for transfers between zones.</p>
        <p>The diagonal represents transfers within the same zone.</p>
      </div>
    </div>
  )
}