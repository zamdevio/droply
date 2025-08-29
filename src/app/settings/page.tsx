'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BellIcon, 
  ShieldCheckIcon, 
  EyeIcon, 
  PaintBrushIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      fileUpdates: true,
      securityAlerts: true
    },
    privacy: {
      analytics: false,
      marketing: false,
      thirdParty: false,
      dataSharing: false
    },
    security: {
      twoFactor: false,
      sessionTimeout: true,
      loginAlerts: true,
      passwordHistory: true
    },
    appearance: {
      darkMode: 'system',
      compactMode: false,
      animations: true,
      highContrast: false
    }
  })

  const [saved, setSaved] = useState(false)

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
    setSaved(false)
  }

  const handleSave = () => {
    // Here you would typically save to backend
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Settings
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Customize your Droply experience and manage your preferences
          </p>
        </div>
      </section>

      {/* Settings Content */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 sm:space-y-12">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/20 rounded-xl flex items-center justify-center">
                    <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Notifications</CardTitle>
                    <CardDescription>Manage how you receive updates and alerts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked: boolean) => updateSetting('notifications', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">Browser push notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked: boolean) => updateSetting('notifications', 'push', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">File Updates</h3>
                      <p className="text-sm text-muted-foreground">When files are accessed</p>
                    </div>
                    <Switch
                      checked={settings.notifications.fileUpdates}
                      onCheckedChange={(checked: boolean) => updateSetting('notifications', 'fileUpdates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Security Alerts</h3>
                      <p className="text-sm text-muted-foreground">Important security events</p>
                    </div>
                    <Switch
                      checked={settings.notifications.securityAlerts}
                      onCheckedChange={(checked: boolean) => updateSetting('notifications', 'securityAlerts', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-950/20 rounded-xl flex items-center justify-center">
                    <EyeIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Privacy</CardTitle>
                    <CardDescription>Control your data and privacy settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Analytics</h3>
                      <p className="text-sm text-muted-foreground">Help improve our service</p>
                    </div>
                    <Switch
                      checked={settings.privacy.analytics}
                      onCheckedChange={(checked: boolean) => updateSetting('privacy', 'analytics', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Marketing</h3>
                      <p className="text-sm text-muted-foreground">Product updates and news</p>
                    </div>
                    <Switch
                      checked={settings.privacy.marketing}
                      onCheckedChange={(checked: boolean) => updateSetting('privacy', 'marketing', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Third Party</h3>
                      <p className="text-sm text-muted-foreground">Essential services only</p>
                    </div>
                    <Switch
                      checked={settings.privacy.thirdParty}
                      onCheckedChange={(checked: boolean) => updateSetting('privacy', 'thirdParty', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Data Sharing</h3>
                      <p className="text-sm text-muted-foreground">Anonymous usage data</p>
                    </div>
                    <Switch
                      checked={settings.privacy.dataSharing}
                      onCheckedChange={(checked: boolean) => updateSetting('privacy', 'dataSharing', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/20 rounded-xl flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Security</CardTitle>
                    <CardDescription>Enhance your account security</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Two-Factor Auth</h3>
                      <p className="text-sm text-muted-foreground">Extra security layer</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactor}
                      onCheckedChange={(checked: boolean) => updateSetting('security', 'twoFactor', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Session Timeout</h3>
                      <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                    </div>
                    <Switch
                      checked={settings.security.sessionTimeout}
                      onCheckedChange={(checked: boolean) => updateSetting('security', 'sessionTimeout', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Login Alerts</h3>
                      <p className="text-sm text-muted-foreground">Notify on new logins</p>
                    </div>
                    <Switch
                      checked={settings.security.loginAlerts}
                      onCheckedChange={(checked: boolean) => updateSetting('security', 'loginAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Password History</h3>
                      <p className="text-sm text-muted-foreground">Prevent password reuse</p>
                    </div>
                    <Switch
                      checked={settings.security.passwordHistory}
                      onCheckedChange={(checked: boolean) => updateSetting('security', 'passwordHistory', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/20 rounded-xl flex items-center justify-center">
                    <PaintBrushIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Appearance</CardTitle>
                    <CardDescription>Customize how Droply looks and feels</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Compact Mode</h3>
                      <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
                    </div>
                    <Switch
                      checked={settings.appearance.compactMode}
                      onCheckedChange={(checked: boolean) => updateSetting('appearance', 'compactMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">Animations</h3>
                      <p className="text-sm text-muted-foreground">Smooth transitions and effects</p>
                    </div>
                    <Switch
                      checked={settings.appearance.animations}
                      onCheckedChange={(checked: boolean) => updateSetting('appearance', 'animations', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <h3 className="font-medium text-foreground">High Contrast</h3>
                      <p className="text-sm text-muted-foreground">Enhanced visibility</p>
                    </div>
                    <Switch
                      checked={settings.appearance.highContrast}
                      onCheckedChange={(checked: boolean) => updateSetting('appearance', 'highContrast', checked)}
                    />
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <div className="mb-3">
                      <h3 className="font-medium text-foreground">Dark Mode</h3>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <div className="flex gap-2">
                      {['light', 'dark', 'system'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updateSetting('appearance', 'darkMode', mode)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            settings.appearance.darkMode === mode
                              ? 'bg-blue-600 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-center pt-8">
              <Button 
                onClick={handleSave}
                className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {saved ? (
                  <>
                    <CheckIcon className="w-5 h-5 mr-2" />
                    Settings Saved!
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
