export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export function generateRouteSlug(origin: string, destination: string): string {
  const originSlug = generateSlug(origin)
  const destinationSlug = generateSlug(destination)
  return `${originSlug}-to-${destinationSlug}`
}

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

export function getCountrySlug(countryCode: string): string {
  const countrySlugMap: Record<string, string> = {
    'IN': 'india',
    'PK': 'pakistan',
    'BD': 'bangladesh',
    'LK': 'sri-lanka',
    'NP': 'nepal',
    'BT': 'bhutan',
    'MV': 'maldives',
    'AF': 'afghanistan'
  }
  
  return countrySlugMap[countryCode] || countryCode.toLowerCase()
}