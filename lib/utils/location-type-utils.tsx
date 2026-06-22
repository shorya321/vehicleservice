import {
  Plane,
  Building2,
  Hotel,
  Train,
  MapPin,
  Anchor,
  Ship,
  Car,
  Bus,
  Mountain,
  Palmtree,
  Tent,
  Church,
  Landmark,
  Warehouse,
  Store,
  Utensils,
  Wrench,
  Shirt,
  Coffee,
  Scissors,
  Briefcase,
  Smartphone,
  ShoppingCart,
  WashingMachine,
  Pill,
  Cake,
  Cross,
  Sparkles,
  Dumbbell,
  GraduationCap,
  Gem,
  ShoppingBag,
  Armchair,
  Camera,
  Trees,
  Music,
  Building,
  Droplets,
  Wine,
  BookOpen,
  PawPrint,
  Palette,
  Fuel,
  FerrisWheel,
  Mail,
  Flag,
  TrainFront,
  Film,
  Fish,
  Ticket,
  Presentation,
  Umbrella,
  Bird,
  TramFront,
  type LucideIcon,
} from 'lucide-react'
import { LocationTypeColorConfig, LocationTypeRecord } from '@/lib/types/location-type'

const ICON_MAP: Record<string, LucideIcon> = {
  'plane': Plane,
  'building-2': Building2,
  'hotel': Hotel,
  'train': Train,
  'map-pin': MapPin,
  'anchor': Anchor,
  'ship': Ship,
  'car': Car,
  'bus': Bus,
  'mountain': Mountain,
  'palm-tree': Palmtree,
  'tent': Tent,
  'church': Church,
  'landmark': Landmark,
  'warehouse': Warehouse,
  'store': Store,
  'utensils': Utensils,
  'wrench': Wrench,
  'shirt': Shirt,
  'coffee': Coffee,
  'scissors': Scissors,
  'briefcase': Briefcase,
  'smartphone': Smartphone,
  'shopping-cart': ShoppingCart,
  'washing-machine': WashingMachine,
  'pill': Pill,
  'cake': Cake,
  'cross': Cross,
  'sparkles': Sparkles,
  'dumbbell': Dumbbell,
  'graduation-cap': GraduationCap,
  'gem': Gem,
  'shopping-bag': ShoppingBag,
  'armchair': Armchair,
  'camera': Camera,
  'trees': Trees,
  'music': Music,
  'building': Building,
  'droplets': Droplets,
  'wine': Wine,
  'book-open': BookOpen,
  'paw-print': PawPrint,
  'palette': Palette,
  'fuel': Fuel,
  'ferris-wheel': FerrisWheel,
  'mail': Mail,
  'flag': Flag,
  'train-front': TrainFront,
  'film': Film,
  'fish': Fish,
  'ticket': Ticket,
  'presentation': Presentation,
  'umbrella': Umbrella,
  'bird': Bird,
  'tram-front': TramFront,
}

export function getLocationTypeIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? MapPin
}

export function getLocationTypeIcon(iconName: string, className = 'h-4 w-4') {
  const Icon = getLocationTypeIconComponent(iconName)
  return <Icon className={className} />
}

export function getLocationTypeBadgeVariant(colorConfig?: LocationTypeColorConfig): string {
  return colorConfig?.badgeVariant ?? 'outline'
}

export function getLocationTypeBadgeClass(colorConfig?: LocationTypeColorConfig): string {
  return colorConfig?.badgeClass ?? ''
}

export function findLocationTypeByName(
  locationTypes: LocationTypeRecord[],
  name: string
): LocationTypeRecord | undefined {
  return locationTypes.find((lt) => lt.name === name)
}

export function findLocationTypeById(
  locationTypes: LocationTypeRecord[],
  id: string
): LocationTypeRecord | undefined {
  return locationTypes.find((lt) => lt.id === id)
}
