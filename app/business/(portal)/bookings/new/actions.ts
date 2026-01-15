'use server';

/**
 * Business Booking Actions
 * Server actions for fetching available vehicle types based on zone pricing
 */

import { createClient } from '@/lib/supabase/server';

export interface VehicleTypeResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryId: string;
  categorySlug: string;
  capacity: number;
  luggageCapacity: number;
  description: string;
  price: number;
  currency: string;
  availableVehicles: number;
  vendorCount: number;
  features: string[];
  image?: string;
}

export interface VehicleTypesByCategory {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  vehicleTypes: VehicleTypeResult[];
  minPrice: number;
}

export interface ZoneInfo {
  fromZone: {
    id: string;
    name: string;
    slug: string;
  };
  toZone: {
    id: string;
    name: string;
    slug: string;
  };
  basePrice: number;
  currency: string;
}

export interface AvailableVehiclesResult {
  vehicleTypes: VehicleTypeResult[];
  vehicleTypesByCategory: VehicleTypesByCategory[];
  zoneInfo?: ZoneInfo;
  error?: string;
}

/**
 * Get available vehicle types for a route based on zone pricing
 */
export async function getAvailableVehicleTypesForRoute(
  fromLocationId: string,
  toLocationId: string,
  passengers: number = 1
): Promise<AvailableVehiclesResult> {
  try {
    const supabase = await createClient();

    // Get location details with zone information
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name, zone_id')
      .in('id', [fromLocationId, toLocationId]);

    if (!locations || locations.length !== 2) {
      return {
        vehicleTypes: [],
        vehicleTypesByCategory: [],
        error: 'Invalid locations selected',
      };
    }

    const fromLocation = locations.find((l) => l.id === fromLocationId);
    const toLocation = locations.find((l) => l.id === toLocationId);

    if (!fromLocation || !toLocation) {
      return {
        vehicleTypes: [],
        vehicleTypesByCategory: [],
        error: 'Invalid locations selected',
      };
    }

    // Check if both locations have zones
    if (!fromLocation.zone_id || !toLocation.zone_id) {
      return {
        vehicleTypes: [],
        vehicleTypesByCategory: [],
        error: 'Selected locations are not configured with service zones',
      };
    }

    // Get zone details
    const { data: zones } = await supabase
      .from('zones')
      .select('id, name, slug')
      .in('id', [fromLocation.zone_id, toLocation.zone_id]);

    if (!zones || zones.length !== 2) {
      return {
        vehicleTypes: [],
        vehicleTypesByCategory: [],
        error: 'Service zones not found',
      };
    }

    const fromZone = zones.find((z) => z.id === fromLocation.zone_id);
    const toZone = zones.find((z) => z.id === toLocation.zone_id);

    if (!fromZone || !toZone) {
      return {
        vehicleTypes: [],
        vehicleTypesByCategory: [],
        error: 'Service zones not found',
      };
    }

    // Get zone pricing
    const { data: zonePricing, error: pricingError } = await supabase
      .from('zone_pricing')
      .select('base_price, currency')
      .eq('from_zone_id', fromZone.id)
      .eq('to_zone_id', toZone.id)
      .eq('is_active', true)
      .single();

    if (pricingError || !zonePricing) {
      return {
        vehicleTypes: [],
        vehicleTypesByCategory: [],
        error: `No service available for route from ${fromLocation.name} to ${toLocation.name}`,
      };
    }

    // Get vehicle types for this zone transfer
    const result = await getVehicleTypesForZoneTransfer(
      fromZone.id,
      toZone.id,
      zonePricing.base_price,
      passengers
    );

    return {
      vehicleTypes: result.vehicleTypes,
      vehicleTypesByCategory: result.vehicleTypesByCategory,
      zoneInfo: {
        fromZone: {
          id: fromZone.id,
          name: fromZone.name,
          slug: fromZone.slug,
        },
        toZone: {
          id: toZone.id,
          name: toZone.name,
          slug: toZone.slug,
        },
        basePrice: zonePricing.base_price,
        currency: zonePricing.currency || 'USD',
      },
    };
  } catch (error) {
    console.error('Error fetching available vehicle types:', error);
    return {
      vehicleTypes: [],
      vehicleTypesByCategory: [],
      error: 'Failed to load available vehicles. Please try again.',
    };
  }
}

/**
 * Get vehicle types for a zone transfer with pricing
 */
// Addon types for booking
export interface AddonItem {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  price: number;
  pricing_type: 'fixed' | 'per_unit';
  max_quantity: number;
  category: string;
}

export interface AddonsByCategory {
  category: string;
  addons: AddonItem[];
}

/**
 * Get active addons for booking form
 */
export async function getActiveAddons(): Promise<{
  addons: AddonItem[];
  addonsByCategory: AddonsByCategory[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('addons')
      .select('id, name, description, icon, price, pricing_type, max_quantity, category')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching addons:', error);
      return { addons: [], addonsByCategory: [], error: error.message };
    }

    const addons = (data || []) as AddonItem[];

    // Group by category
    const categoryMap = new Map<string, AddonItem[]>();
    addons.forEach((addon) => {
      if (!categoryMap.has(addon.category)) {
        categoryMap.set(addon.category, []);
      }
      categoryMap.get(addon.category)!.push(addon);
    });

    // Define category order
    const categoryOrder = ['Child Safety', 'Luggage', 'Comfort'];
    const addonsByCategory: AddonsByCategory[] = [];

    categoryOrder.forEach((cat) => {
      if (categoryMap.has(cat)) {
        addonsByCategory.push({
          category: cat,
          addons: categoryMap.get(cat)!,
        });
      }
    });

    // Add any remaining categories
    categoryMap.forEach((categoryAddons, category) => {
      if (!categoryOrder.includes(category)) {
        addonsByCategory.push({ category, addons: categoryAddons });
      }
    });

    return { addons, addonsByCategory };
  } catch (error) {
    console.error('Error in getActiveAddons:', error);
    return { addons: [], addonsByCategory: [], error: 'Failed to load addons' };
  }
}

async function getVehicleTypesForZoneTransfer(
  fromZoneId: string,
  toZoneId: string,
  basePrice: number,
  passengers: number
): Promise<{
  vehicleTypes: VehicleTypeResult[];
  vehicleTypesByCategory: VehicleTypesByCategory[];
}> {
  const supabase = await createClient();

  // Get vehicle types with pricing for zone transfer
  const { data: vehicleTypesData, error: typesError } = await supabase
    .from('vehicle_types')
    .select(
      `
      id,
      name,
      slug,
      passenger_capacity,
      luggage_capacity,
      description,
      category_id,
      image_url,
      price_multiplier,
      business_price_multiplier,
      vehicle_categories!left(
        id,
        name,
        slug,
        sort_order
      )
    `
    )
    .eq('is_active', true)
    .gte('passenger_capacity', passengers)
    .order('passenger_capacity', { ascending: true });

  if (typesError || !vehicleTypesData) {
    console.error('Error fetching vehicle types:', typesError);
    return { vehicleTypes: [], vehicleTypesByCategory: [] };
  }

  // Process data into VehicleTypeResult format with zone-based pricing
  const vehicleTypes: VehicleTypeResult[] = vehicleTypesData.map((vt) => {
    // Calculate price using zone base price and business-specific multiplier
    // Business portal uses business_price_multiplier, falling back to price_multiplier if not set
    const multiplier = vt.business_price_multiplier || vt.price_multiplier || 1.0;
    const calculatedPrice = basePrice * multiplier;

    return {
      id: vt.id,
      name: vt.name,
      slug: vt.slug,
      category: vt.vehicle_categories?.name || 'Standard',
      categoryId: vt.category_id || '',
      categorySlug: vt.vehicle_categories?.slug || 'standard',
      capacity: vt.passenger_capacity,
      luggageCapacity: vt.luggage_capacity,
      description: vt.description || '',
      price: calculatedPrice,
      currency: 'USD',
      availableVehicles: 10, // Show as available for aggregator model
      vendorCount: 5, // Show multiple vendors available
      features: [],
      image: vt.image_url || undefined,
    };
  });

  // Group by category
  const categories = new Map<string, VehicleTypesByCategory>();

  vehicleTypes.forEach((vt) => {
    if (!categories.has(vt.categoryId)) {
      categories.set(vt.categoryId, {
        categoryId: vt.categoryId,
        categoryName: vt.category,
        categorySlug: vt.categorySlug,
        vehicleTypes: [],
        minPrice: Number.MAX_VALUE,
      });
    }

    const category = categories.get(vt.categoryId)!;
    category.vehicleTypes.push(vt);
    category.minPrice = Math.min(category.minPrice, vt.price);
  });

  const vehicleTypesByCategory = Array.from(categories.values()).sort(
    (a, b) => a.minPrice - b.minPrice
  );

  return { vehicleTypes, vehicleTypesByCategory };
}
