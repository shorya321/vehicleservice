export interface LocationTypeColorConfig {
  color: string
  bg: string
  progressBg: string
  badgeClass: string
  badgeVariant: string
}

export interface LocationTypeRecord {
  id: string
  name: string
  label: string
  icon_name: string
  color_config: LocationTypeColorConfig
  abbreviation: string
  sort_order: number
  is_active: boolean
  created_at: string | null
}
