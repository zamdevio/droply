'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ShieldCheckIcon,
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useCookieConsent } from '@/hooks/useCookieConsent'

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { 
    preferences, 
    updatePreferences, 
    acceptAll, 
    acceptSelected 
  } = useCookieConsent()

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('dc_consent')
    if (!hasConsented) {
      // Show banner after a short delay to avoid immediate popup
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    acceptAll()
    setIsVisible(false)
  }

  const handleAcceptSelected = () => {
    acceptSelected()
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    // Only accept necessary cookies
    updatePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    })
    setIsVisible(false)
  }

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    if (key === 'necessary') return // Can't disable necessary cookies
    
    updatePreferences({ [key]: value })
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  We use cookies to enhance your experience
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  We use cookies to provide essential functionality, analyze site usage, and deliver personalized content. 
                  You can choose which types of cookies to allow below.
                </p>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleAcceptAll}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Accept All
                  </Button>
                  
                  <Button
                    onClick={handleAcceptSelected}
                    variant="outline"
                    size="sm"
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                  
                  <Button
                    onClick={handleRejectAll}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Reject All
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Expandable Details */}
        <div className="mt-6">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <InformationCircleIcon className="w-4 h-4 mr-2" />
            {showDetails ? 'Hide' : 'Show'} cookie details
          </Button>
          
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Necessary</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Essential for the website to function
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Analytics</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Help us understand website usage
                    </div>
                  </div>
                  <Button
                    variant={preferences.analytics ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreferenceChange('analytics', !preferences.analytics)}
                    className="w-16"
                  >
                    {preferences.analytics ? 'On' : 'Off'}
                  </Button>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Marketing</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Used for personalized ads
                    </div>
                  </div>
                  <Button
                    variant={preferences.marketing ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreferenceChange('marketing', !preferences.marketing)}
                    className="w-16"
                  >
                    {preferences.marketing ? 'On' : 'Off'}
                  </Button>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Functional</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Enable enhanced features
                    </div>
                  </div>
                  <Button
                    variant={preferences.functional ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreferenceChange('functional', !preferences.functional)}
                    className="w-16"
                  >
                    {preferences.functional ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>

              {/* Final Actions */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleAcceptSelected}
                  className="flex-1"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
                
                <Button
                  onClick={handleAcceptAll}
                  variant="outline"
                  className="flex-1"
                >
                  Accept All Cookies
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
