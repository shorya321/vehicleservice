import {
  isValidPhone,
  normalizePhone,
  optionalPhoneSchema,
  phoneSchema,
  sanitizePhoneInput,
  toStoredPhone,
} from '@/lib/validation/phone'

describe('normalizePhone', () => {
  it('strips human formatting and keeps a leading +', () => {
    expect(normalizePhone('+971 50 123 4567')).toBe('+971501234567')
    expect(normalizePhone('(050) 123-4567')).toBe('0501234567')
    expect(normalizePhone('971.50.123.4567')).toBe('971501234567')
  })

  it('returns an empty string for blank input', () => {
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone('   ')).toBe('')
    expect(normalizePhone(null)).toBe('')
    expect(normalizePhone(undefined)).toBe('')
  })
})

describe('isValidPhone', () => {
  it.each([
    '+971 50 123 4567',
    '(050) 123-4567',
    '971501234567',
    '+971501234567',
  ])('accepts %s', (input) => {
    expect(isValidPhone(input)).toBe(true)
  })

  it.each([
    // The bug that shipped an email address into the driver assignment email.
    'anshul@fanaticcoders',
    'anshul@fanaticcoders.com',
    'abc',
    '12345',
    '',
  ])('rejects %s', (input) => {
    expect(isValidPhone(input)).toBe(false)
  })

  it('rejects a number starting with zero after the country code', () => {
    expect(isValidPhone('+0501234567')).toBe(false)
  })
})

describe('toStoredPhone', () => {
  it('returns the normalized number when valid', () => {
    expect(toStoredPhone('+971 50 123 4567')).toBe('+971501234567')
  })

  it('returns null for anything that is not a phone number', () => {
    expect(toStoredPhone('anshul@fanaticcoders')).toBeNull()
    expect(toStoredPhone('')).toBeNull()
    expect(toStoredPhone(null)).toBeNull()
  })
})

describe('sanitizePhoneInput', () => {
  it('drops characters an email would introduce', () => {
    expect(sanitizePhoneInput('anshul@fanaticcoders.com')).toBe('.')
  })

  it('preserves human phone formatting', () => {
    expect(sanitizePhoneInput('+971 50 123-4567')).toBe('+971 50 123-4567')
    expect(sanitizePhoneInput('(050) 123-4567')).toBe('(050) 123-4567')
  })

  it('only allows a leading +', () => {
    expect(sanitizePhoneInput('+971+50')).toBe('+97150')
    expect(sanitizePhoneInput('971+50')).toBe('97150')
  })
})

describe('phoneSchema', () => {
  it('parses to the normalized number', () => {
    expect(phoneSchema.parse('+971 50 123 4567')).toBe('+971501234567')
  })

  it('rejects an email address', () => {
    expect(phoneSchema.safeParse('anshul@fanaticcoders').success).toBe(false)
  })

  it('rejects a blank value', () => {
    expect(phoneSchema.safeParse('').success).toBe(false)
  })
})

describe('optionalPhoneSchema', () => {
  it('parses a blank value to null', () => {
    expect(optionalPhoneSchema.parse('')).toBeNull()
    expect(optionalPhoneSchema.parse(undefined)).toBeNull()
    expect(optionalPhoneSchema.parse(null)).toBeNull()
  })

  it('parses a valid value to the normalized number', () => {
    expect(optionalPhoneSchema.parse('(050) 123 4567')).toBe('0501234567')
  })

  it('rejects an email address', () => {
    expect(optionalPhoneSchema.safeParse('anshul@fanaticcoders').success).toBe(false)
  })
})
