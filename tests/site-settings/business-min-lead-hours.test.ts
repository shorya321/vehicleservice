import { siteSettingsSchema } from '@/lib/site-settings/schema'
import { parseSiteSettings, DEFAULT_BUSINESS_MIN_LEAD_HOURS } from '@/lib/site-settings/types'
import { parseBusinessMinLeadHours } from '@/lib/business/trips/settings'

const lead = siteSettingsSchema.shape.business_min_lead_hours

describe('business_min_lead_hours', () => {
  it('accepts whole hours from 0 to 72, as the number input sends them', () => {
    expect(lead.safeParse('0').data).toBe(0)
    expect(lead.safeParse('2').data).toBe(2)
    expect(lead.safeParse(72).data).toBe(72)
  })

  it('refuses a cleared field, fractions and out-of-range values', () => {
    expect(lead.safeParse(Number.NaN).success).toBe(false)
    expect(lead.safeParse('1.5').success).toBe(false)
    expect(lead.safeParse('-1').success).toBe(false)
    expect(lead.safeParse('73').success).toBe(false)
  })

  it('reads a missing or bad stored value as the default, on both sides', () => {
    expect(DEFAULT_BUSINESS_MIN_LEAD_HOURS).toBe(2)
    for (const raw of [undefined, null, '3', 1.5, -1, 73]) {
      expect(parseSiteSettings({ business_min_lead_hours: raw }).business_min_lead_hours).toBe(2)
      expect(parseBusinessMinLeadHours(raw)).toBe(2)
    }
    expect(parseSiteSettings({ business_min_lead_hours: 0 }).business_min_lead_hours).toBe(0)
    expect(parseBusinessMinLeadHours(0)).toBe(0)
    expect(parseBusinessMinLeadHours(6)).toBe(6)
  })
})
