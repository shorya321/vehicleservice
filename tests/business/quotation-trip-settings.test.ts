jest.mock('server-only', () => ({}), { virtual: true });

/**
 * Quotations obey the admin's trip-type switches (Settings > General > Trip types), the same
 * site_settings.config.trip_types the booking wizard reads.
 */

import { tripTypeSettingsError } from '@/lib/business/quotations/prepare-trips';
import { DEFAULT_BUSINESS_TRIP_SETTINGS } from '@/lib/business/trips/settings';

const on = DEFAULT_BUSINESS_TRIP_SETTINGS;

describe('tripTypeSettingsError', () => {
  it('always allows one way', () => {
    expect(tripTypeSettingsError('one_way', 0, { ...on, round_trip_enabled: false, multi_city_enabled: false, hourly_enabled: false })).toBeNull();
  });

  it('refuses a type the admin switched off', () => {
    expect(tripTypeSettingsError('hourly', 0, { ...on, hourly_enabled: false })).toMatch(/switched off/);
    expect(tripTypeSettingsError('round_trip', 2, { ...on, round_trip_enabled: false })).toMatch(/switched off/);
    expect(tripTypeSettingsError('multi_city', 2, { ...on, multi_city_enabled: false })).toMatch(/switched off/);
  });

  it('follows the admin journey limit for multi-city', () => {
    expect(tripTypeSettingsError('multi_city', 4, { ...on, multi_city_max_legs: 4 })).toBeNull();
    expect(tripTypeSettingsError('multi_city', 5, { ...on, multi_city_max_legs: 4 })).toMatch(/at most 4/);
  });
});
