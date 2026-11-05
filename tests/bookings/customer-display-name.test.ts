import { resolveCustomerDisplayName } from '@/lib/bookings/customer-display-name'

describe('resolveCustomerDisplayName', () => {
  it('uses the primary passenger for a guest booking, trimming stray spaces', () => {
    expect(resolveCustomerDisplayName({ first_name: 'John ', last_name: 'Wick' }, null)).toBe('John Wick')
  })

  it('prefers the passenger over the profile name', () => {
    expect(resolveCustomerDisplayName({ first_name: 'Jane', last_name: 'Doe' }, 'Account Holder')).toBe('Jane Doe')
  })

  it('falls back to the profile name when there is no passenger', () => {
    expect(resolveCustomerDisplayName(null, ' Account Holder ')).toBe('Account Holder')
  })

  it('falls back to the profile name when passenger names are blank', () => {
    expect(resolveCustomerDisplayName({ first_name: ' ', last_name: null }, 'Account Holder')).toBe('Account Holder')
  })

  it('keeps a single passenger name part', () => {
    expect(resolveCustomerDisplayName({ first_name: 'Cher', last_name: '' }, null)).toBe('Cher')
  })

  it('returns Customer when nothing is known', () => {
    expect(resolveCustomerDisplayName(null, null)).toBe('Customer')
    expect(resolveCustomerDisplayName({ first_name: null, last_name: null }, '  ')).toBe('Customer')
  })
})
