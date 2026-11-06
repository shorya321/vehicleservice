/**
 * Registered company details (Settings > General). Every field is optional, and an
 * empty one must hide its line everywhere rather than print a blank label.
 */
import { asSentence, companyLegalLine, formatLicence, getCompanyDetails } from '@/lib/site-settings/company'
import { DEFAULT_SITE_SETTINGS, parseSiteSettings } from '@/lib/site-settings/types'
import { siteSettingsSchema } from '@/lib/site-settings/schema'
import { resolveAboutCompany } from '@/app/about/company-facts'

describe('formatLicence', () => {
  it('joins number and issuer', () => {
    expect(formatLicence('123456', 'Dubai DET')).toBe('123456, issued by Dubai DET')
  })
  it('shows the number alone when no issuer is set', () => {
    expect(formatLicence(' 123456 ', '')).toBe('123456')
  })
  it('never shows an issuer without a number', () => {
    expect(formatLicence('', 'Dubai DET')).toBe('')
    expect(formatLicence('   ', 'Dubai DET')).toBe('')
  })
})

describe('companyLegalLine', () => {
  const base = { legal_name: '', trade_licence_number: '', licence_issuer: '' }

  it('is empty when nothing is set, so nothing renders', () => {
    expect(companyLegalLine(base)).toBe('')
    expect(companyLegalLine(null)).toBe('')
    expect(companyLegalLine({ ...base, licence_issuer: 'Dubai DET' })).toBe('')
  })
  it('names the company and licence', () => {
    expect(
      companyLegalLine({ legal_name: 'Example LLC', trade_licence_number: '123', licence_issuer: 'DET' })
    ).toBe('Operated by Example LLC, trade licence 123, issued by DET')
  })
  it('handles each field alone', () => {
    expect(companyLegalLine({ ...base, legal_name: ' Example LLC ' })).toBe('Operated by Example LLC')
    expect(companyLegalLine({ ...base, trade_licence_number: '123' })).toBe('Trade licence 123')
  })
})

describe('asSentence', () => {
  it('ends with exactly one full stop', () => {
    expect(asSentence('Infinia Transfers')).toBe('Infinia Transfers.')
    expect(asSentence('Example L.L.C.')).toBe('Example L.L.C.')
    expect(asSentence('Example. ')).toBe('Example.')
    expect(asSentence('  ')).toBe('')
  })
})

describe('settings parsing', () => {
  it('defaults the new fields to empty for a stored config that predates them', () => {
    const parsed = parseSiteSettings({ brand_name: 'Infinia Transfers', office_address: 'Somewhere' })
    expect(parsed.legal_name).toBe('')
    expect(parsed.trade_licence_number).toBe('')
    expect(parsed.licence_issuer).toBe('')
    expect(parsed.office_address).toBe('Somewhere')
  })
  it('ignores non-string values', () => {
    expect(parseSiteSettings({ legal_name: 42 }).legal_name).toBe('')
  })
  it('the save schema keeps the fields (so a save does not drop them) and trims them', () => {
    const result = siteSettingsSchema.safeParse({
      ...DEFAULT_SITE_SETTINGS,
      legal_name: '  Example LLC  ',
      trade_licence_number: ' 123 ',
      licence_issuer: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.legal_name).toBe('Example LLC')
      expect(result.data.trade_licence_number).toBe('123')
      expect(result.data.licence_issuer).toBe('')
    }
  })
  it('accepts the defaults as they are today', () => {
    expect(siteSettingsSchema.safeParse(DEFAULT_SITE_SETTINGS).success).toBe(true)
  })
})

describe('About company facts', () => {
  const site = { legal_name: 'Settings LLC', trade_licence_number: '999', licence_issuer: 'DET' }

  it('falls back to Settings when the page leaves them empty', () => {
    expect(resolveAboutCompany({ legalName: '', licence: '', licenceIssuer: '' }, site)).toEqual({
      legalName: 'Settings LLC',
      licence: '999, issued by DET',
    })
  })
  it('prefers values typed on the About page', () => {
    expect(resolveAboutCompany({ legalName: 'Page LLC', licence: '111', licenceIssuer: '' }, site)).toEqual({
      legalName: 'Page LLC',
      licence: '111',
    })
  })
  it('stays empty when neither is set', () => {
    expect(
      resolveAboutCompany(
        { legalName: '', licence: '', licenceIssuer: '' },
        { legal_name: '', trade_licence_number: '', licence_issuer: '' }
      )
    ).toEqual({ legalName: '', licence: '' })
  })
  it('matches getCompanyDetails for Settings-only input', () => {
    expect(resolveAboutCompany({ legalName: '', licence: '', licenceIssuer: '' }, site)).toEqual(getCompanyDetails(site))
  })
})
