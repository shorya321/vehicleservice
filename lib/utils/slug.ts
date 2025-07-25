/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphenated slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate a route slug from origin and destination
 * @param origin - Origin location name
 * @param destination - Destination location name
 * @returns A route slug in format "origin-to-destination"
 */
export function generateRouteSlug(origin: string, destination: string): string {
  const originSlug = generateSlug(origin)
  const destinationSlug = generateSlug(destination)
  return `${originSlug}-to-${destinationSlug}`
}

/**
 * Parse a route slug to extract origin and destination
 * @param routeSlug - The route slug to parse
 * @returns Object with origin and destination slugs
 */
export function parseRouteSlug(routeSlug: string): { origin: string; destination: string } | null {
  const parts = routeSlug.split('-to-')
  if (parts.length !== 2) {
    return null
  }
  return {
    origin: parts[0],
    destination: parts[1]
  }
}

/**
 * Generate a country code from country name
 * Common mappings for the Indian subcontinent
 */
export function getCountrySlug(countryCode: string): string {
  const countryMap: Record<string, string> = {
    'IN': 'india',
    'PK': 'pakistan',
    'BD': 'bangladesh',
    'LK': 'sri-lanka',
    'NP': 'nepal',
    'BT': 'bhutan',
    'MV': 'maldives',
    'AF': 'afghanistan'
  }
  
  return countryMap[countryCode.toUpperCase()] || countryCode.toLowerCase()
}