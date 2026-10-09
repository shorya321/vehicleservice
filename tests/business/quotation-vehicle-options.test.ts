/**
 * Builder rules for the alternative vehicles a quotation trip offers.
 */

import {
  canAddVehicleOption,
  reconcileVehicleOptions,
  toggleVehicleOption,
  withoutMainVehicle,
} from '@/lib/business/quotations/vehicle-options';

const v = (id: string, price = 100) => ({ id, name: `Car ${id}`, price });
const o = (id: string, price = 100) => ({
  vehicle_type_id: id,
  vehicle_type_name: `Car ${id}`,
  net_base_price_aed: price,
});

describe('toggleVehicleOption', () => {
  it('adds a vehicle with its cost', () => {
    expect(toggleVehicleOption([], v('a', 250), 'main')).toEqual([o('a', 250)]);
  });

  it('removes a vehicle that is already offered', () => {
    expect(toggleVehicleOption([o('a'), o('b')], v('a'), 'main')).toEqual([o('b')]);
  });

  it('never offers the main vehicle', () => {
    expect(toggleVehicleOption([], v('main'), 'main')).toEqual([]);
  });

  it('stops at five options', () => {
    const five = ['a', 'b', 'c', 'd', 'e'].map((id) => o(id));
    expect(canAddVehicleOption(five)).toBe(false);
    expect(toggleVehicleOption(five, v('f'), 'main')).toEqual(five);
  });
});

describe('withoutMainVehicle', () => {
  it('drops a vehicle once it becomes the main one', () => {
    expect(withoutMainVehicle([o('a'), o('b')], 'a')).toEqual([o('b')]);
  });
});

describe('reconcileVehicleOptions', () => {
  it('refreshes costs from the new list', () => {
    expect(reconcileVehicleOptions([o('a', 100)], [v('a', 180)], 'main')).toEqual([o('a', 180)]);
  });

  it('drops a vehicle the route no longer offers', () => {
    expect(reconcileVehicleOptions([o('a'), o('b')], [v('b')], 'main')).toEqual([o('b')]);
  });

  it('drops an option that is now the main vehicle', () => {
    expect(reconcileVehicleOptions([o('a')], [v('a')], 'a')).toEqual([]);
  });

  it('keeps order', () => {
    expect(reconcileVehicleOptions([o('b'), o('a')], [v('a'), v('b')], 'main')).toEqual([o('b'), o('a')]);
  });
});
