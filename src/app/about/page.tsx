'use client'

import Link from 'next/link'
import { 
  ShieldCheckIcon, 
  CloudArrowUpIcon, 
  ClockIcon, 
  LockClosedIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 sm:mb-8 leading-tight">
            About <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Droply</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            We're building the future of secure file sharing, one encrypted upload at a time.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 sm:mb-8">
                Our Mission
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed">
                In today's digital world, sharing files securely shouldn't be complicated. 
                We believe everyone deserves access to enterprise-grade security without the enterprise complexity.
              </p>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
                Droply was born from a simple idea: what if we could make file sharing as secure as it is simple? 
                The result is a platform that developers love, businesses trust, and individuals can rely on.
              </p>
              <Link 
                href="/upload" 
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <CloudArrowUpIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Try It Now
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-3xl p-8 sm:p-12">
                <div className="grid grid-cols-2 gap-6 sm:gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShieldCheckIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Security First</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">End-to-end encryption</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ClockIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Smart Expiry</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Auto-cleanup</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <LockClosedIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Password Protected</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Extra security</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <DevicePhoneMobileIcon className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Cross-Platform</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Works everywhere</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              What Makes Us Different
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Built by developers, for developers, with security at the core
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            <div className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-950/20 rounded-xl flex items-center justify-center flex-shrink-0 mb-6">
                <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Military-Grade Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use industry-standard encryption protocols and never store your encryption keys.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-950/20 rounded-xl flex items-center justify-center flex-shrink-0 mb-6">
                <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Smart File Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatic cleanup, download tracking, and intelligent expiry management.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 dark:bg-indigo-950/20 rounded-xl flex items-center justify-center flex-shrink-0 mb-6">
                <DevicePhoneMobileIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Responsive Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Works perfectly on desktop, tablet, and mobile with touch-friendly controls.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 dark:bg-orange-950/20 rounded-xl flex items-center justify-center flex-shrink-0 mb-6">
                <GlobeAltIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Global Infrastructure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built on Cloudflare's global network for lightning-fast performance worldwide.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-950/20 rounded-xl flex items-center justify-center flex-shrink-0 mb-6">
                <CodeBracketIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Developer Friendly</h3>
              <p className="text-muted-foreground leading-relaxed">
                Clean APIs, comprehensive documentation, and easy integration.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-950/20 rounded-xl flex items-center justify-center flex-shrink-0 mb-6">
                <ServerIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Enterprise Ready</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built to scale with enterprise-grade reliability and support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Built with Modern Tech
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              We use cutting-edge technologies to ensure performance, security, and reliability
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 sm:gap-10">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-400">N</span>
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">Next.js</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-400">T</span>
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">TypeScript</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-400">T</span>
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">Tailwind</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-400">P</span>
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">PostgreSQL</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-400">R</span>
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">Redis</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-400">C</span>
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">Cloudflare</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-700 dark:via-indigo-700 dark:to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Experience Secure File Sharing?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of users who trust Droply for their file sharing needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link 
              href="/upload" 
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Start Sharing Now
            </Link>
            <Link 
              href="/docs" 
              className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold rounded-xl border-2 border-white transition-all duration-200"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
