// Utility functions for Google Maps integration

export interface LocationDetails {
  address: string
  city: string | null
  country: string | null
  countryCode: string | null
  latitude: number | null
  longitude: number | null
}

// Map of country names to ISO country codes
const countryCodeMap: Record<string, string> = {
  'United Arab Emirates': 'AE',
  'United States': 'US',
  'United Kingdom': 'GB',
  'Saudi Arabia': 'SA',
  'Qatar': 'QA',
  'Kuwait': 'KW',
  'Bahrain': 'BH',
  'Oman': 'OM',
  'Egypt': 'EG',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'India': 'IN',
  'Pakistan': 'PK',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Canada': 'CA',
  'Australia': 'AU',
  'China': 'CN',
  'Japan': 'JP',
  // Add more countries as needed
}

export function extractLocationDetails(place: google.maps.places.PlaceResult): LocationDetails {
  const details: LocationDetails = {
    address: place.formatted_address || '',
    city: null,
    country: null,
    countryCode: null,
    latitude: null,
    longitude: null,
  }

  // Extract city and country from address components
  if (place.address_components) {
    for (const component of place.address_components) {
      const types = component.types || []
      
      // Get city
      if (types.includes('locality') || types.includes('administrative_area_level_1')) {
        details.city = component.long_name
      }
      
      // Get country
      if (types.includes('country')) {
        details.country = component.long_name
        details.countryCode = component.short_name
      }
    }
  }

  // Get coordinates
  if (place.geometry?.location) {
    details.latitude = place.geometry.location.lat()
    details.longitude = place.geometry.location.lng()
  }

  // If country code is not in the standard format, try to map it
  if (details.country && !details.countryCode) {
    details.countryCode = countryCodeMap[details.country] || null
  }

  return details
}

// Get timezone by country code
export function getTimezoneByCountryCode(countryCode: string): string | null {
  // Comprehensive timezone mapping by country code
  const timezonesByCountryCode: Record<string, string> = {
    // Middle East
    'AE': 'Asia/Dubai',
    'SA': 'Asia/Riyadh',
    'QA': 'Asia/Qatar',
    'KW': 'Asia/Kuwait',
    'BH': 'Asia/Bahrain',
    'OM': 'Asia/Muscat',
    'YE': 'Asia/Aden',
    'JO': 'Asia/Amman',
    'LB': 'Asia/Beirut',
    'SY': 'Asia/Damascus',
    'IQ': 'Asia/Baghdad',
    'IR': 'Asia/Tehran',
    'IL': 'Asia/Jerusalem',
    'PS': 'Asia/Gaza',
    
    // Asia
    'IN': 'Asia/Kolkata',
    'PK': 'Asia/Karachi',
    'BD': 'Asia/Dhaka',
    'LK': 'Asia/Colombo',
    'NP': 'Asia/Kathmandu',
    'BT': 'Asia/Thimphu',
    'MM': 'Asia/Yangon',
    'TH': 'Asia/Bangkok',
    'VN': 'Asia/Ho_Chi_Minh',
    'MY': 'Asia/Kuala_Lumpur',
    'SG': 'Asia/Singapore',
    'ID': 'Asia/Jakarta',
    'PH': 'Asia/Manila',
    'CN': 'Asia/Shanghai',
    'HK': 'Asia/Hong_Kong',
    'TW': 'Asia/Taipei',
    'JP': 'Asia/Tokyo',
    'KR': 'Asia/Seoul',
    
    // Europe
    'GB': 'Europe/London',
    'IE': 'Europe/Dublin',
    'FR': 'Europe/Paris',
    'DE': 'Europe/Berlin',
    'IT': 'Europe/Rome',
    'ES': 'Europe/Madrid',
    'PT': 'Europe/Lisbon',
    'NL': 'Europe/Amsterdam',
    'BE': 'Europe/Brussels',
    'CH': 'Europe/Zurich',
    'AT': 'Europe/Vienna',
    'SE': 'Europe/Stockholm',
    'NO': 'Europe/Oslo',
    'DK': 'Europe/Copenhagen',
    'FI': 'Europe/Helsinki',
    'PL': 'Europe/Warsaw',
    'CZ': 'Europe/Prague',
    'HU': 'Europe/Budapest',
    'GR': 'Europe/Athens',
    'TR': 'Europe/Istanbul',
    'RU': 'Europe/Moscow',
    
    // Africa
    'EG': 'Africa/Cairo',
    'ZA': 'Africa/Johannesburg',
    'NG': 'Africa/Lagos',
    'KE': 'Africa/Nairobi',
    'ET': 'Africa/Addis_Ababa',
    'MA': 'Africa/Casablanca',
    'TN': 'Africa/Tunis',
    'DZ': 'Africa/Algiers',
    
    // Americas
    'US': 'America/New_York', // Default for US, should be more specific based on state
    'CA': 'America/Toronto', // Default for Canada
    'MX': 'America/Mexico_City',
    'BR': 'America/Sao_Paulo',
    'AR': 'America/Argentina/Buenos_Aires',
    'CL': 'America/Santiago',
    'PE': 'America/Lima',
    'CO': 'America/Bogota',
    'VE': 'America/Caracas',
    
    // Oceania
    'AU': 'Australia/Sydney', // Default for Australia
    'NZ': 'Pacific/Auckland',
    'FJ': 'Pacific/Fiji',
  }
  
  return timezonesByCountryCode[countryCode] || null
}