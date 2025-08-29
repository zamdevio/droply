'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ShieldCheckIcon,
  Cog6ToothIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { getCookieStats } from '@/lib/cookies'

export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const { 
    preferences, 
    hasConsented, 
    updatePreferences, 
    acceptAll, 
    acceptSelected, 
    getCookieCount 
  } = useCookieConsent()

  const handleAcceptAll = () => {
    acceptAll()
    setOpen(false)
  }

  const handleAcceptSelected = () => {
    acceptSelected()
    setOpen(false)
  }

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    if (key === 'necessary') return // Can't disable necessary cookies
    
    updatePreferences({ [key]: value })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <ShieldCheckIcon className="w-4 h-4 mr-2" />
          Cookies
          {hasConsented && (
            <span className="ml-2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full">
              {getCookieCount()}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            We use cookies to enhance your experience. Choose your preferences below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Necessary Cookies */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Necessary</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Essential for the website to function properly
              </div>
            </div>
            <div className="flex items-center">
              <CheckIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Analytics</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Help us understand how visitors interact with our website
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
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Marketing</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Used to deliver personalized advertisements
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
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Functional</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Enable enhanced functionality and personalization
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

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleAcceptSelected}
            className="w-full sm:w-auto"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-2" />
            Accept Selected
          </Button>
          <Button
            onClick={handleAcceptAll}
            className="w-full sm:w-auto"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Accept All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
