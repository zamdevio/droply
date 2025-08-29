'use client'

import { useCookieConsent } from '@/hooks/useCookieConsent'
import { Button } from '@/components/ui/button'
import { 
  ShieldCheckIcon,
  ChartBarIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function CookiesPage() {
  const { 
    preferences, 
    hasConsented, 
    updatePreferences, 
    acceptAll, 
    acceptSelected, 
    getCookieCount,
    isAllowed 
  } = useCookieConsent()

  const handleToggle = (type: keyof typeof preferences) => {
    if (type === 'necessary') return // Can't disable necessary cookies
    
    updatePreferences({ [type]: !preferences[type] })
  }

  const handleReset = () => {
    updatePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheckIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Cookie Preferences
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Manage your cookie preferences to control how we use cookies to enhance your experience.
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Current Cookie Status
        </h2>
        
        {hasConsented ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckIcon className="w-6 h-6 text-green-600" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  Cookie preferences saved
                </span>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                {getCookieCount()} cookies enabled
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Necessary</span>
                  <span className="text-green-600 dark:text-green-400">Always On</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Essential for the website to function properly
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Analytics</span>
                  <span className={preferences.analytics ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                    {preferences.analytics ? 'On' : 'Off'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Help us understand website usage
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Marketing</span>
                  <span className={preferences.marketing ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                    {preferences.marketing ? 'On' : 'Off'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Used for personalized advertisements
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Functional</span>
                  <span className={preferences.functional ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                    {preferences.functional ? 'On' : 'Off'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable enhanced functionality
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <XMarkIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No cookie preferences set
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven't set your cookie preferences yet.
            </p>
          </div>
        )}
      </div>

      {/* Cookie Types */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Cookie Types & Controls
        </h2>
        
        <div className="space-y-6">
          {/* Necessary Cookies */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Necessary Cookies</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Essential for the website to function properly. These cannot be disabled.
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 dark:text-green-400 font-medium">Always On</span>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Analytics Cookies</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Help us understand how visitors interact with our website.
                </p>
              </div>
            </div>
            <Button
              variant={preferences.analytics ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('analytics')}
              className="w-20"
            >
              {preferences.analytics ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Marketing Cookies */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <MegaphoneIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Marketing Cookies</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Used to deliver personalized advertisements and track marketing campaigns.
                </p>
              </div>
            </div>
            <Button
              variant={preferences.marketing ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('marketing')}
              className="w-20"
            >
              {preferences.marketing ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Functional Cookies */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Cog6ToothIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Functional Cookies</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable enhanced functionality and personalization features.
                </p>
              </div>
            </div>
            <Button
              variant={preferences.functional ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle('functional')}
              className="w-20"
            >
              {preferences.functional ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={acceptAll}
            size="lg"
            className="flex-1"
          >
            <CheckIcon className="w-5 h-5 mr-2" />
            Accept All Cookies
          </Button>
          
          <Button
            onClick={acceptSelected}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <Cog6ToothIcon className="w-5 h-5 mr-2" />
            Save Current Preferences
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <XMarkIcon className="w-5 h-5 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 About Cookies
        </h2>
        <div className="space-y-3 text-blue-800 dark:text-blue-200">
          <p>
            <strong>Necessary cookies</strong> are essential for the website to function and cannot be disabled.
          </p>
          <p>
            <strong>Analytics cookies</strong> help us understand how visitors use our website to improve performance.
          </p>
          <p>
            <strong>Marketing cookies</strong> are used to deliver relevant advertisements and track campaign effectiveness.
          </p>
          <p>
            <strong>Functional cookies</strong> enable enhanced features like personalization and saved preferences.
          </p>
          <p className="text-sm mt-4">
            Your preferences are saved locally and will persist across browser sessions. You can change these settings at any time.
          </p>
        </div>
      </div>
    </div>
  )
}
