/**
 * The search fleet: class strip, quick filters, sort and grouping. The UI is a
 * thin layer over these functions, so every rule that decides which vehicle
 * shows, in what order and under which header is pinned here.
 */
import {
  buildFleetGroups,
  classLevels,
  fromPrice,
  isBookable,
  needChips,
  sortVehicles,
  splitVehicleName,
  DEFAULT_FLEET_SORT,
} from '@/app/search/results/components/fleet-model'
import type { VehicleTypeResult, VehicleTypesByCategory } from '@/app/search/results/actions'

function vt(
  name: string,
  categoryId: string,
  price: number,
  capacity: number,
  luggageCapacity: number,
  availableVehicles = 1
): VehicleTypeResult {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    category: categoryId,
    categoryId,
    categorySlug: categoryId,
    capacity,
    luggageCapacity,
    description: '',
    price,
    currency: 'AED',
    availableVehicles,
    vendorCount: 1,
    features: [],
  }
}

function cat(categoryId: string, categoryName: string, vehicleTypes: VehicleTypeResult[]): VehicleTypesByCategory {
  return {
    categoryId,
    categoryName,
    categorySlug: categoryId,
    vehicleTypes,
    minPrice: Math.min(...vehicleTypes.map((v) => v.price)),
  }
}

const camry = vt('Toyota Camry', 'exec', 100, 3, 2)
const lexus = vt('Lexus ES', 'exec', 110, 3, 2)
const vclass = vt('Mercedes V-Class', 'van', 160, 6, 5)
const tahoe = vt('Chevrolet Tahoe', 'suv', 170, 6, 4)
const sprinter = vt('Mercedes Sprinter', 'bus', 200, 12, 12)
const phantom = vt('Rolls Royce Phantom', 'ultra', 500, 3, 3)

const ALL = [camry, lexus, vclass, tahoe, sprinter, phantom]
const BY_CATEGORY = [
  cat('exec', 'Executive', [camry, lexus]),
  cat('van', 'Mini vans', [vclass]),
  cat('suv', 'Luxury SUVs', [tahoe]),
  cat('bus', 'Vans', [sprinter]),
  cat('ultra', 'Ultra luxury', [phantom]),
]

describe('isBookable', () => {
  it('needs at least one available vehicle', () => {
    expect(isBookable(camry)).toBe(true)
    expect(isBookable({ ...camry, availableVehicles: 0 })).toBe(false)
  })
})

describe('sortVehicles', () => {
  it('keeps the four existing sorts', () => {
    expect(sortVehicles([lexus, phantom, camry], 'price-asc').map((v) => v.price)).toEqual([100, 110, 500])
    expect(sortVehicles([lexus, phantom, camry], 'price-desc').map((v) => v.price)).toEqual([500, 110, 100])
    expect(sortVehicles([camry, sprinter, vclass], 'capacity').map((v) => v.capacity)).toEqual([12, 6, 3])
    expect(sortVehicles([phantom, camry, lexus], 'name').map((v) => v.name)).toEqual([
      'Lexus ES',
      'Rolls Royce Phantom',
      'Toyota Camry',
    ])
  })

  it('puts unbookable vehicles last whatever the sort', () => {
    const soldOut = { ...camry, id: 'sold', availableVehicles: 0 }
    expect(sortVehicles([soldOut, phantom, lexus], 'price-asc').map((v) => v.id)).toEqual([
      lexus.id,
      phantom.id,
      'sold',
    ])
    expect(sortVehicles([soldOut, phantom, lexus], 'price-desc').map((v) => v.id).pop()).toBe('sold')
  })

  it('does not mutate its input', () => {
    const input = [phantom, camry]
    sortVehicles(input, 'price-asc')
    expect(input).toEqual([phantom, camry])
  })
})

describe('fromPrice', () => {
  it('is the lowest bookable price', () => {
    expect(fromPrice([lexus, { ...camry, availableVehicles: 0 }, phantom])).toBe(110)
  })

  it('is null when nothing can be booked, never a sold-out fare', () => {
    expect(fromPrice([{ ...camry, availableVehicles: 0 }])).toBeNull()
    expect(fromPrice([])).toBeNull()
  })
})

describe('classLevels', () => {
  it('ranks classes 1 to 5 by their from-price', () => {
    expect(classLevels(BY_CATEGORY)).toEqual({ exec: 1, van: 2, suv: 3, bus: 4, ultra: 5 })
  })

  it('gives tied classes the same level', () => {
    const tied = [cat('a', 'A', [vt('A1', 'a', 100, 3, 2)]), cat('b', 'B', [vt('B1', 'b', 100, 3, 2)]), cat('c', 'C', [vt('C1', 'c', 300, 3, 2)])]
    const levels = classLevels(tied)
    expect(levels.a).toBe(levels.b)
    expect(levels.c).toBe(5)
  })

  it('returns nothing for a single class, where a meter says nothing', () => {
    expect(classLevels([cat('exec', 'Executive', [camry, lexus])])).toEqual({})
  })

  it('leaves out a class with nothing bookable', () => {
    const levels = classLevels([...BY_CATEGORY, cat('gone', 'Gone', [vt('G', 'gone', 50, 3, 2, 0)])])
    expect(levels.gone).toBeUndefined()
    expect(levels.exec).toBe(1)
  })
})

describe('needChips', () => {
  it('offers only filters that narrow the list without emptying it', () => {
    const ids = needChips(ALL).map((n) => n.id)
    // 4+ and 6+ passengers both keep some and drop some; 8+ and 12+ keep only the Sprinter.
    expect(ids).toEqual(['passengers-4', 'passengers-6', 'passengers-8', 'passengers-12', 'bags-3', 'bags-5'])
  })

  it('drops a chip that would keep every vehicle', () => {
    const big = [vclass, tahoe]
    const ids = needChips(big).map((n) => n.id)
    expect(ids).not.toContain('passengers-4')
    expect(ids).not.toContain('passengers-6')
    expect(ids).not.toContain('bags-3')
  })

  it('drops a chip that would keep nothing', () => {
    expect(needChips([camry, lexus])).toEqual([])
  })

  it('labels chips in words', () => {
    const chips = needChips(ALL)
    expect(chips.find((c) => c.id === 'passengers-6')?.label).toBe('6+ passengers')
    expect(chips.find((c) => c.id === 'bags-3')?.label).toBe('3+ bags')
  })
})

describe('buildFleetGroups', () => {
  const base = { byCategory: BY_CATEGORY, all: ALL, categoryId: null, needId: null, sort: DEFAULT_FLEET_SORT }

  it('groups by class in category order on the default sort', () => {
    const groups = buildFleetGroups(base)
    expect(groups.map((g) => g.name)).toEqual(['Executive', 'Mini vans', 'Luxury SUVs', 'Vans', 'Ultra luxury'])
    expect(groups[0].vehicles.map((v) => v.name)).toEqual(['Toyota Camry', 'Lexus ES'])
    expect(groups[0].fromPrice).toBe(100)
    expect(groups[0].level).toBe(1)
  })

  it('shows one flat, headerless list on any other sort', () => {
    const groups = buildFleetGroups({ ...base, sort: 'price-desc' })
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBeNull()
    expect(groups[0].vehicles.map((v) => v.price)).toEqual([500, 200, 170, 160, 110, 100])
  })

  it('narrows to one class', () => {
    const groups = buildFleetGroups({ ...base, categoryId: 'exec' })
    expect(groups.map((g) => g.name)).toEqual(['Executive'])
  })

  it('applies a need and drops classes it empties', () => {
    const groups = buildFleetGroups({ ...base, needId: 'passengers-6' })
    expect(groups.map((g) => g.name)).toEqual(['Mini vans', 'Luxury SUVs', 'Vans'])
  })

  it('ignores a need that the selected class no longer offers', () => {
    // Inside Executive nothing seats 6, so the chip is gone; the stale id must not empty the page.
    const groups = buildFleetGroups({ ...base, categoryId: 'exec', needId: 'passengers-6' })
    expect(groups.flatMap((g) => g.vehicles)).toHaveLength(2)
  })

  it('never loses a vehicle that has no category group', () => {
    const stray = vt('Stray Coach', 'none', 900, 20, 20)
    const groups = buildFleetGroups({ ...base, all: [...ALL, stray] })
    const shown = groups.flatMap((g) => g.vehicles).map((v) => v.name)
    expect(shown).toContain('Stray Coach')
    expect(groups[groups.length - 1].name).toBe('Other vehicles')
  })

  it('treats an unknown class id as All rather than an empty page', () => {
    const groups = buildFleetGroups({ ...base, categoryId: 'deleted' })
    expect(groups.flatMap((g) => g.vehicles)).toHaveLength(ALL.length)
  })

  it('puts sold-out vehicles last inside their group and out of the from-price', () => {
    const soldCamry = { ...camry, availableVehicles: 0 }
    const groups = buildFleetGroups({
      ...base,
      all: [soldCamry, lexus],
      byCategory: [cat('exec', 'Executive', [soldCamry, lexus])],
    })
    expect(groups[0].vehicles.map((v) => v.name)).toEqual(['Lexus ES', 'Toyota Camry'])
    expect(groups[0].fromPrice).toBe(110)
  })

  it('returns no groups for an empty fleet', () => {
    expect(buildFleetGroups({ ...base, all: [], byCategory: [] })).toEqual([])
  })
})

describe('splitVehicleName', () => {
  it('splits a known make from the model', () => {
    expect(splitVehicleName('Toyota Camry')).toEqual({ make: 'Toyota', model: 'Camry' })
    expect(splitVehicleName('BMW 7 Series')).toEqual({ make: 'BMW', model: '7 Series' })
    expect(splitVehicleName('Mercedes G-Wagon')).toEqual({ make: 'Mercedes', model: 'G-Wagon' })
  })

  it('keeps two-word makes together', () => {
    expect(splitVehicleName('Rolls Royce Phantom')).toEqual({ make: 'Rolls Royce', model: 'Phantom' })
    expect(splitVehicleName('Land Rover Defender')).toEqual({ make: 'Land Rover', model: 'Defender' })
  })

  it('keeps the name whole when the first word is not a make', () => {
    // Range Rover is a model line, not a make; splitting it would print "Range" over "Rover".
    expect(splitVehicleName('Range Rover')).toEqual({ make: null, model: 'Range Rover' })
    expect(splitVehicleName('Executive Sedan')).toEqual({ make: null, model: 'Executive Sedan' })
  })

  it('keeps a make with no model whole, and trims', () => {
    expect(splitVehicleName('Tesla')).toEqual({ make: null, model: 'Tesla' })
    expect(splitVehicleName('  Chevrolet Tahoe  ')).toEqual({ make: 'Chevrolet', model: 'Tahoe' })
  })
})
