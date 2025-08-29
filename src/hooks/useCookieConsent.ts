'use client'

import { useState, useEffect } from 'react'
import { 
  getCookieConsent, 
  setCookieConsent, 
  hasAnyCookieConsent,
  type CookiePreferences 
} from '@/lib/cookies'

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false
  })
  const [hasConsented, setHasConsented] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load cookie preferences
    const consent = getCookieConsent()
    if (consent) {
      setPreferences(consent)
      setHasConsented(true)
    }
    setIsLoaded(true)
  }, [])

  const updatePreferences = (newPreferences: Partial<CookiePreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    
    // Set cookies using utility function
    setCookieConsent(updated)
    
    setHasConsented(true)
  }

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    updatePreferences(allAccepted)
  }

  const acceptSelected = () => {
    updatePreferences(preferences)
  }



  const getCookieCount = () => {
    return Object.values(preferences).filter(Boolean).length
  }

  const isAllowed = (type: keyof CookiePreferences) => {
    return preferences[type]
  }

  const needsConsent = () => {
    return !hasAnyCookieConsent()
  }

  return {
    preferences,
    hasConsented,
    isLoaded,
    updatePreferences,
    acceptAll,
    acceptSelected,
    getCookieCount,
    isAllowed,
    needsConsent
  }
}
