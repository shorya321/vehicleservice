'use client'

import { useState, useEffect, useMemo } from 'react'
import { SearchResultVehicle } from '../actions'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'

interface SearchFiltersProps {
  vehicles: SearchResultVehicle[]
  onFiltersChange: (filters: {
    categories: string[]
    priceRange: [number, number]
    minRating: number
    features: string[]
  }) => void
  sortBy: 'price' | 'rating' | 'capacity'
  onSortChange: (sort: 'price' | 'rating' | 'capacity') => void
}

export function SearchFilters({ 
  vehicles, 
  onFiltersChange,
  sortBy,
  onSortChange
}: SearchFiltersProps) {
  // Extract unique values from vehicles
  const categories = useMemo(() => Array.from(new Set(vehicles.map(v => v.category))), [vehicles])
  const allFeatures = useMemo(() => Array.from(new Set(vehicles.flatMap(v => v.features))), [vehicles])
  const minPrice = useMemo(() => Math.min(...vehicles.map(v => v.price)), [vehicles])
  const maxPrice = useMemo(() => Math.max(...vehicles.map(v => v.price)), [vehicles])

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [minPrice, maxPrice])
  const [minRating, setMinRating] = useState(0)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  // Update price range when min/max changes
  useEffect(() => {
    setPriceRange([minPrice, maxPrice])
  }, [minPrice, maxPrice])

  useEffect(() => {
    onFiltersChange({
      categories: selectedCategories,
      priceRange,
      minRating,
      features: selectedFeatures
    })
  }, [selectedCategories, priceRange, minRating, selectedFeatures, onFiltersChange])

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category])
    } else {
      setSelectedCategories(selectedCategories.filter(c => c !== category))
    }
  }

  const handleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures([...selectedFeatures, feature])
    } else {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature))
    }
  }

  return (
    <div className="space-y-6">
      {/* Sort By */}
      <div className="bg-card rounded-lg p-4">
        <Label className="text-base font-semibold mb-3 block">Sort By</Label>
        <Select value={sortBy} onValueChange={(value: any) => onSortChange(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price: Low to High</SelectItem>
            <SelectItem value="rating">Rating: High to Low</SelectItem>
            <SelectItem value="capacity">Capacity: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Vehicle Categories */}
      <div className="bg-card rounded-lg p-4">
        <Label className="text-base font-semibold mb-3 block">Vehicle Category</Label>
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
              />
              <Label 
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="bg-card rounded-lg p-4">
        <Label className="text-base font-semibold mb-3 block">Price Range</Label>
        <div className="space-y-4">
          <Slider
            min={minPrice}
            max={maxPrice}
            step={10}
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(priceRange[0])}</span>
            <span>{formatCurrency(priceRange[1])}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Minimum Rating */}
      <div className="bg-card rounded-lg p-4">
        <Label className="text-base font-semibold mb-3 block">Minimum Rating</Label>
        <RadioGroup value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="rating-0" />
              <Label htmlFor="rating-0" className="text-sm font-normal cursor-pointer">
                All ratings
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="rating-3" />
              <Label htmlFor="rating-3" className="text-sm font-normal cursor-pointer">
                3+ stars
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="4" id="rating-4" />
              <Label htmlFor="rating-4" className="text-sm font-normal cursor-pointer">
                4+ stars
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="4.5" id="rating-4.5" />
              <Label htmlFor="rating-4.5" className="text-sm font-normal cursor-pointer">
                4.5+ stars
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Features */}
      {allFeatures.length > 0 && (
        <div className="bg-card rounded-lg p-4">
          <Label className="text-base font-semibold mb-3 block">Features</Label>
          <div className="space-y-2">
            {allFeatures.slice(0, 5).map(feature => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature}`}
                  checked={selectedFeatures.includes(feature)}
                  onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                />
                <Label 
                  htmlFor={`feature-${feature}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}