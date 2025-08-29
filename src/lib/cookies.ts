// Cookie consent management with encrypted names and enhanced security
export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

// Cookie names
const COOKIE_NAMES = {
  // Main consent cookie
  CONSENT: '_cns',
  // Persistent consent cookie  
  CONSENT_PERSISTENT: '_pcns',
  // Session tracking
  SESSION: '_ssn',
  // User ID
  USER_ID: '_uid',
} as const

// Cookie expiration times
const EXPIRATION = {
  SESSION: 0, // Expires when browser closes
  PERSISTENT: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
} as const

// Simple encryption for cookie values
function encryptValue(value: string): string {
  // Convert to base64
  const base64 = btoa(value)
  // Add timestamp for uniqueness
  const timestamp = Date.now().toString(36)
  return `${base64}_${timestamp}`
}

function decryptValue(encryptedValue: string): string | null {
  try {
    // Remove timestamp and decode
    const [base64] = encryptedValue.split('_')
    return atob(base64)
  } catch {
    return null
  }
}

// Check if user has any cookie consent set
export function hasAnyCookieConsent(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Check localStorage first
    const localConsent = localStorage.getItem('dc_consent')
    if (localConsent) return true
    
    // Check cookies
    const cookies = document.cookie.split(';')
    const hasConsentCookie = cookies.some(cookie => 
      cookie.trim().startsWith(`${COOKIE_NAMES.CONSENT}=`)
    )
    
    return hasConsentCookie
  } catch {
    return false
  }
}

// Get current cookie consent preferences
export function getCookieConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  
  try {
    // Try localStorage first (faster)
    const localConsent = localStorage.getItem('dc_consent')
    if (localConsent) {
      return JSON.parse(localConsent)
    }
    
    // Fallback to cookies
    const cookies = document.cookie.split(';')
    const consentCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${COOKIE_NAMES.CONSENT}=`)
    )
    
    if (consentCookie) {
      const value = consentCookie.split('=')[1]
      const decrypted = decryptValue(value)
      if (decrypted) {
        return JSON.parse(decrypted)
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to parse cookie consent:', error)
    return null
  }
}

// Check if specific cookie type is allowed
export function isCookieAllowed(type: keyof CookiePreferences): boolean {
  const consent = getCookieConsent()
  if (!consent) return false
  
  return consent[type]
}

// Set cookie consent with encryption
export function setCookieConsent(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return
  
  try {
    // Save to localStorage (unencrypted for performance)
    localStorage.setItem('dc_consent', JSON.stringify(preferences))
    
    // Encrypt the preferences data
    const encryptedData = encryptValue(JSON.stringify(preferences))
    
    // Set session cookie (expires when browser closes)
    document.cookie = `${COOKIE_NAMES.CONSENT}=${encryptedData}; path=/; SameSite=Strict; Secure`
    
    // Set persistent cookie (expires in 1 year)
    const oneYear = new Date()
    oneYear.setFullYear(oneYear.getFullYear() + 1)
    document.cookie = `${COOKIE_NAMES.CONSENT_PERSISTENT}=${encryptedData}; path=/; expires=${oneYear.toUTCString()}; SameSite=Strict; Secure`
    
    // Set session tracking cookie
    const sessionData = encryptValue(JSON.stringify({
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 50) // Truncated for privacy
    }))
    document.cookie = `${COOKIE_NAMES.SESSION}=${sessionData}; path=/; SameSite=Strict; Secure`
    
  } catch (error) {
    console.error('Failed to set cookie consent:', error)
  }
}

// Clear all cookie consent data
export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return
  
  try {
    // Remove from localStorage
    localStorage.removeItem('dc_consent')
    
    // Remove cookies by setting them to expire in the past
    const pastDate = new Date(0)
    const pastDateString = pastDate.toUTCString()
    
    document.cookie = `${COOKIE_NAMES.CONSENT}=; path=/; expires=${pastDateString}`
    document.cookie = `${COOKIE_NAMES.CONSENT_PERSISTENT}=; path=/; expires=${pastDateString}`
    document.cookie = `${COOKIE_NAMES.SESSION}=; path=/; expires=${pastDateString}`
    
  } catch (error) {
    console.error('Failed to clear cookie consent:', error)
  }
}

// Get cookie statistics for analytics
export function getCookieStats(): {
  totalCookies: number
  consentLevel: 'none' | 'minimal' | 'partial' | 'full'
  lastUpdated: Date | null
} {
  const consent = getCookieConsent()
  if (!consent) {
    return {
      totalCookies: 0,
      consentLevel: 'none',
      lastUpdated: null
    }
  }
  
  const enabledCount = Object.values(consent).filter(Boolean).length
  const totalCount = Object.keys(consent).length
  
  let consentLevel: 'none' | 'minimal' | 'partial' | 'full'
  if (enabledCount === 0) consentLevel = 'none'
  else if (enabledCount === 1) consentLevel = 'minimal'
  else if (enabledCount < totalCount) consentLevel = 'partial'
  else consentLevel = 'full'
  
  return {
    totalCookies: enabledCount,
    consentLevel,
    lastUpdated: new Date() // We could store actual timestamp if needed
  }
}

// Export cookie names for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Cookie Names (Dev):', COOKIE_NAMES)
}
