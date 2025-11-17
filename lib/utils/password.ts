/**
 * Generates a secure random password
 * @param length - Length of the password (default: 12)
 * @param options - Password generation options
 * @returns Generated password string
 */
export function generateSecurePassword(
  length: number = 12,
  options: {
    includeUppercase?: boolean
    includeLowercase?: boolean
    includeNumbers?: boolean
    includeSymbols?: boolean
    excludeAmbiguous?: boolean
  } = {}
): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeAmbiguous = true
  } = options

  let charset = ''
  
  if (includeLowercase) {
    charset += excludeAmbiguous ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  }
  
  if (includeUppercase) {
    charset += excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }
  
  if (includeNumbers) {
    charset += excludeAmbiguous ? '23456789' : '0123456789'
  }
  
  if (includeSymbols) {
    charset += '!@#$%^&*'
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be included')
  }

  let password = ''
  const array = new Uint8Array(length)
  
  // Use crypto.getRandomValues for cryptographically secure random numbers
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Server-side: use Node.js crypto
    require('crypto').randomFillSync(array)
  }
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }
  
  // Ensure password has at least one character from each enabled type
  const hasLower = !includeLowercase || /[a-z]/.test(password)
  const hasUpper = !includeUppercase || /[A-Z]/.test(password)
  const hasNumber = !includeNumbers || /[0-9]/.test(password)
  const hasSymbol = !includeSymbols || /[!@#$%^&*]/.test(password)
  
  if (!hasLower || !hasUpper || !hasNumber || !hasSymbol) {
    // Recursively generate a new password if requirements aren't met
    return generateSecurePassword(length, options)
  }
  
  return password
}

/**
 * Formats a password for display with copy functionality
 * @param password - The password to format
 * @returns Object with display and copy text
 */
export function formatPasswordForDisplay(password: string): {
  display: string
  masked: string
} {
  return {
    display: password,
    masked: '•'.repeat(password.length)
  }
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Validation result with score and feedback
 */
export function validatePasswordStrength(password: string): {
  score: number
  feedback: string[]
  isValid: boolean
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters long')
  } else {
    score += 1
  }
  
  if (password.length >= 12) {
    score += 1
  }
  
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }
  
  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters')
  }
  
  return {
    score,
    feedback,
    isValid: score >= 4 && password.length >= 8
  }
}