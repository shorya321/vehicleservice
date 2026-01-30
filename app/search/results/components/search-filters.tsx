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
import { motion } from 'motion/react'

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
      <motion.div
        className="backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Label className="text-base font-sans text-luxury-pearl mb-3 block">Sort By</Label>
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
      </motion.div>

      <Separator className="border-luxury-gold/10" />

      {/* Vehicle Categories */}
      <motion.div
        className="backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Label className="text-base font-sans text-luxury-pearl mb-3 block">Vehicle Category</Label>
        <div className="space-y-2">
          {categories.map(category => (
            <div
              key={category}
              className="flex items-center space-x-2 group hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Checkbox
                id={`category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                className="transition-all duration-200 data-[state=checked]:bg-luxury-gold data-[state=checked]:border-luxury-gold"
              />
              <Label
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer text-luxury-lightGray group-hover:text-luxury-pearl transition-colors"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </motion.div>

      <Separator className="border-luxury-gold/10" />

      {/* Price Range */}
      <motion.div
        className="backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Label className="text-base font-sans text-luxury-pearl mb-3 block">Price Range</Label>
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
      </motion.div>

      <Separator className="border-luxury-gold/10" />

      {/* Minimum Rating */}
      <motion.div
        className="backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Label className="text-base font-sans text-luxury-pearl mb-3 block">Minimum Rating</Label>
        <RadioGroup value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 group hover:scale-105 active:scale-95 transition-all cursor-pointer">
              <RadioGroupItem value="0" id="rating-0" className="transition-colors data-[state=checked]:border-luxury-gold data-[state=checked]:text-luxury-gold" />
              <Label htmlFor="rating-0" className="text-sm font-normal cursor-pointer text-luxury-lightGray group-hover:text-luxury-pearl transition-colors">
                All ratings
              </Label>
            </div>
            <div className="flex items-center space-x-2 group hover:scale-105 active:scale-95 transition-all cursor-pointer">
              <RadioGroupItem value="3" id="rating-3" className="transition-colors data-[state=checked]:border-luxury-gold data-[state=checked]:text-luxury-gold" />
              <Label htmlFor="rating-3" className="text-sm font-normal cursor-pointer text-luxury-lightGray group-hover:text-luxury-pearl transition-colors">
                3+ stars
              </Label>
            </div>
            <div className="flex items-center space-x-2 group hover:scale-105 active:scale-95 transition-all cursor-pointer">
              <RadioGroupItem value="4" id="rating-4" className="transition-colors data-[state=checked]:border-luxury-gold data-[state=checked]:text-luxury-gold" />
              <Label htmlFor="rating-4" className="text-sm font-normal cursor-pointer text-luxury-lightGray group-hover:text-luxury-pearl transition-colors">
                4+ stars
              </Label>
            </div>
            <div className="flex items-center space-x-2 group hover:scale-105 active:scale-95 transition-all cursor-pointer">
              <RadioGroupItem value="4.5" id="rating-4.5" className="transition-colors data-[state=checked]:border-luxury-gold data-[state=checked]:text-luxury-gold" />
              <Label htmlFor="rating-4.5" className="text-sm font-normal cursor-pointer text-luxury-lightGray group-hover:text-luxury-pearl transition-colors">
                4.5+ stars
              </Label>
            </div>
          </div>
        </RadioGroup>
      </motion.div>

      <Separator className="border-luxury-gold/10" />

      {/* Features */}
      {allFeatures.length > 0 && (
        <motion.div
          className="backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Label className="text-base font-sans text-luxury-pearl mb-3 block">Features</Label>
          <div className="space-y-2">
            {allFeatures.slice(0, 5).map(feature => (
              <div
                key={feature}
                className="flex items-center space-x-2 group hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Checkbox
                  id={`feature-${feature}`}
                  checked={selectedFeatures.includes(feature)}
                  onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                  className="transition-all duration-200 data-[state=checked]:bg-luxury-gold data-[state=checked]:border-luxury-gold"
                />
                <Label
                  htmlFor={`feature-${feature}`}
                  className="text-sm font-normal cursor-pointer text-luxury-lightGray group-hover:text-luxury-pearl transition-colors"
                >
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}