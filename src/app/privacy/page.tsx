'use client'

import Link from 'next/link'
import { 
  ShieldCheckIcon, 
  EyeIcon, 
  LockClosedIcon, 
  TrashIcon,
  DocumentTextIcon,
  UserIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 sm:mb-8 leading-tight">
            Privacy <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Your privacy is our priority. Learn how we protect your data and maintain transparency.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12 sm:space-y-16">
            {/* Information Collection */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-xl flex items-center justify-center">
                  <EyeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Information Collection</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We collect minimal information necessary to provide our file sharing service:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Files you upload (encrypted and stored temporarily)</li>
                  <li>Basic usage analytics (anonymized)</li>
                  <li>Technical information (IP address, browser type)</li>
                  <li>Service performance metrics</li>
                </ul>
                <p>
                  We do not collect personal information such as names, email addresses, or phone numbers.
                </p>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">How We Use Information</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>The information we collect is used exclusively for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Providing and improving our file sharing service</li>
                  <li>Ensuring security and preventing abuse</li>
                  <li>Monitoring service performance and reliability</li>
                  <li>Complying with legal obligations</li>
                </ul>
                <p>
                  We never sell, rent, or share your information with third parties for marketing purposes.
                </p>
              </div>
            </div>

            {/* Data Security */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/20 rounded-xl flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Data Security</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>We implement industry-standard security measures:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>End-to-end encryption for all file transfers</li>
                  <li>Secure HTTPS connections for all communications</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure data centers with physical security measures</li>
                </ul>
                <p>
                  Your files are encrypted before they leave your device and remain encrypted during storage.
                </p>
              </div>
            </div>

            {/* Data Retention */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/20 rounded-xl flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Data Retention</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>We follow strict data retention policies:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Files are automatically deleted when they expire</li>
                  <li>Expired files are permanently removed within 24 hours</li>
                  <li>Logs are retained for up to 30 days for security purposes</li>
                  <li>Analytics data is anonymized and retained for up to 1 year</li>
                </ul>
                <p>
                  You can also manually delete your files at any time through our service.
                </p>
              </div>
            </div>

            {/* Third-Party Services */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-950/20 rounded-xl flex items-center justify-center">
                  <ServerIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Third-Party Services</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>We use trusted third-party services for essential functions:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Cloudflare for CDN and DDoS protection</li>
                  <li>PostgreSQL for database management</li>
                  <li>Redis for caching and rate limiting</li>
                  <li>Cloudflare R2 for file storage</li>
                </ul>
                <p>
                  All third-party services are carefully vetted and bound by strict data protection agreements.
                </p>
              </div>
            </div>

            {/* Your Rights */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/20 rounded-xl flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Rights</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access any personal information we may have about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Request data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <p>
                  To exercise these rights, please contact us through our support channels.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-xl flex items-center justify-center">
                  <LockClosedIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Contact Us</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="font-medium text-foreground">Support Team</p>
                  <p>Email: support@droply.com</p>
                  <p>Response Time: Within 24 hours</p>
                </div>
                <p>
                  We're committed to addressing your privacy concerns promptly and transparently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-700 dark:via-indigo-700 dark:to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Questions About Privacy?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
            We're here to help. Contact our support team for any privacy-related questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link 
              href="/help" 
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Get Help
            </Link>
            <Link 
              href="/upload" 
              className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold rounded-xl border-2 border-white transition-all duration-200"
            >
              Start Sharing Files
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
