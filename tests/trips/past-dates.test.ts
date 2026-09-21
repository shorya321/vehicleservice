import { rollPastDatesForward } from '@/lib/trips/past-dates'

const TODAY = '2026-09-21'

describe('rollPastDatesForward', () => {
  it('leaves a search dated today or later alone', () => {
    expect(rollPastDatesForward({ date: '2026-09-21', passengers: '2' }, TODAY)).toBeNull()
    expect(rollPastDatesForward({ date: '2026-10-05', passengers: '2' }, TODAY)).toBeNull()
  })

  it('moves a past one-way date to today and keeps every other param', () => {
    const next = rollPastDatesForward({ date: '2026-01-05', passengers: '2', adults: '2', time: '10:00' }, TODAY)
    expect(next?.get('date')).toBe(TODAY)
    expect(next?.get('passengers')).toBe('2')
    expect(next?.get('adults')).toBe('2')
    expect(next?.get('time')).toBe('10:00')
  })

  it('moves a round trip return that the new departure overtook', () => {
    const next = rollPastDatesForward(
      { date: '2026-01-05', trip: 'round_trip', return: '2026-01-08' },
      TODAY
    )
    expect(next?.get('date')).toBe(TODAY)
    expect(next?.get('return')).toBe(TODAY)
  })

  it('keeps a future return when only the departure was past', () => {
    const next = rollPastDatesForward(
      { date: '2026-01-05', trip: 'round_trip', return: '2026-09-25' },
      TODAY
    )
    expect(next?.get('return')).toBe('2026-09-25')
  })

  it('rolls past multi-city journeys forward in order and keeps their times', () => {
    const next = rollPastDatesForward(
      { trip: 'multi_city', legs: 'a~b@2026-01-05@09:00,b~c@2026-01-06,c~d@2026-09-30' },
      TODAY
    )
    expect(next?.get('legs')).toBe('a~b@2026-09-21@09:00,b~c@2026-09-21,c~d@2026-09-30')
  })

  it('leaves future multi-city journeys alone', () => {
    expect(
      rollPastDatesForward({ trip: 'multi_city', legs: 'a~b@2026-09-22,b~c@2026-09-23' }, TODAY)
    ).toBeNull()
  })

  it('ignores malformed values rather than inventing a date', () => {
    expect(rollPastDatesForward({ date: 'yesterday', legs: 'nonsense' }, TODAY)).toBeNull()
  })
})
