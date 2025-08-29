'use client'

import Link from 'next/link'
import { 
  CloudArrowUpIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-950/10 dark:to-indigo-950/10" />
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
            Secure File
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent"> Sharing</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
            Share files securely with end-to-end encryption, customizable expiry times, and password protection. 
            Perfect for developers, teams, and anyone who values privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link 
              href="/upload" 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Start Sharing Files
            </Link>
            <Link 
              href="/about" 
              className="w-full sm:w-auto bg-card hover:bg-muted text-foreground px-8 py-4 text-lg font-semibold rounded-xl border border-border transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Why Choose Droply?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with modern technologies and security-first principles
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {/* Feature 1 */}
            <div className="text-center p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Military-Grade Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                End-to-end encryption ensures your files are protected from upload to download
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ClockIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Flexible Expiry</h3>
              <p className="text-muted-foreground leading-relaxed">
                Set custom expiration times from 1 hour to 30 days or permanent storage
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 dark:bg-indigo-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <DevicePhoneMobileIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Cross-Platform</h3>
              <p className="text-muted-foreground leading-relaxed">
                Works seamlessly on desktop, tablet, and mobile devices
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 dark:bg-orange-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GlobeAltIcon className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Global CDN</h3>
              <p className="text-muted-foreground leading-relaxed">
                Lightning-fast downloads worldwide with our global content delivery network
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 dark:bg-purple-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LockClosedIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Password Protection</h3>
              <p className="text-muted-foreground leading-relaxed">
                Add an extra layer of security with custom passwords for each file
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CloudArrowUpIcon className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Easy Sharing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Simple drag-and-drop interface with instant sharing links
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-700 dark:via-indigo-700 dark:to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of users who trust Droply for their secure file sharing needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link 
              href="/upload" 
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Upload Your First File
            </Link>
            <Link 
              href="/docs" 
              className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold rounded-xl border-2 border-white transition-all duration-200"
            >
              View API Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
