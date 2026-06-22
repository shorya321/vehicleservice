import { LocationTypeColorConfig } from '@/lib/types/location-type'

export const LOCATION_TYPE_ICON_OPTIONS = [
  { value: 'plane', label: 'Plane (Airport)' },
  { value: 'building-2', label: 'Building (City)' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'train', label: 'Train (Station)' },
  { value: 'map-pin', label: 'Map Pin' },
  { value: 'anchor', label: 'Anchor (Port)' },
  { value: 'ship', label: 'Ship' },
  { value: 'car', label: 'Car' },
  { value: 'bus', label: 'Bus' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'palm-tree', label: 'Palm Tree' },
  { value: 'tent', label: 'Tent' },
  { value: 'church', label: 'Church' },
  { value: 'landmark', label: 'Landmark' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'store', label: 'Store' },
] as const

export interface ColorThemePreset {
  name: string
  label: string
  config: LocationTypeColorConfig
}

export const COLOR_THEME_PRESETS: ColorThemePreset[] = [
  {
    name: 'sky',
    label: 'Sky Blue',
    config: {
      color: 'text-sky-500',
      bg: 'bg-sky-500/10',
      progressBg: 'bg-sky-500',
      badgeClass: 'border border-sky-500/20 bg-sky-500/5 text-sky-500',
      badgeVariant: 'default',
    },
  },
  {
    name: 'emerald',
    label: 'Emerald Green',
    config: {
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      progressBg: 'bg-emerald-500',
      badgeClass: 'border border-emerald-500/20 bg-emerald-500/5 text-emerald-500',
      badgeVariant: 'secondary',
    },
  },
  {
    name: 'amber',
    label: 'Amber',
    config: {
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      progressBg: 'bg-amber-500',
      badgeClass: 'border border-amber-500/20 bg-amber-500/5 text-amber-500',
      badgeVariant: 'outline',
    },
  },
  {
    name: 'violet',
    label: 'Violet',
    config: {
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      progressBg: 'bg-violet-500',
      badgeClass: 'border border-violet-500/20 bg-violet-500/5 text-violet-500',
      badgeVariant: 'destructive',
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    config: {
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      progressBg: 'bg-rose-500',
      badgeClass: 'border border-rose-500/20 bg-rose-500/5 text-rose-500',
      badgeVariant: 'default',
    },
  },
  {
    name: 'cyan',
    label: 'Cyan',
    config: {
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      progressBg: 'bg-cyan-500',
      badgeClass: 'border border-cyan-500/20 bg-cyan-500/5 text-cyan-500',
      badgeVariant: 'secondary',
    },
  },
  {
    name: 'orange',
    label: 'Orange',
    config: {
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      progressBg: 'bg-orange-500',
      badgeClass: 'border border-orange-500/20 bg-orange-500/5 text-orange-500',
      badgeVariant: 'outline',
    },
  },
  {
    name: 'indigo',
    label: 'Indigo',
    config: {
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      progressBg: 'bg-indigo-500',
      badgeClass: 'border border-indigo-500/20 bg-indigo-500/5 text-indigo-500',
      badgeVariant: 'default',
    },
  },
]

export function getColorThemeByName(name: string): ColorThemePreset | undefined {
  return COLOR_THEME_PRESETS.find((p) => p.name === name)
}
