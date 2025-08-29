'use client'

import Link from 'next/link'
import { 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  UserIcon,
  ServerIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 sm:mb-8 leading-tight">
            Terms & <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Conditions</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Please read these terms carefully before using our file sharing service.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12 sm:space-y-16">
            {/* Acceptance */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Acceptance of Terms</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  By accessing and using Droply's file sharing service, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
                <p>
                  If you do not agree to abide by the above, please do not use this service. We reserve the right to modify these terms at any time.
                </p>
              </div>
            </div>

            {/* Use License */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-xl flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Use License</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Permission is granted to temporarily use Droply for personal, non-commercial transitory viewing only.</p>
                <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to reverse engineer any software contained on Droply</li>
                  <li>Remove any copyright or other proprietary notations</li>
                </ul>
              </div>
            </div>

            {/* User Responsibilities */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/20 rounded-xl flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">User Responsibilities</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>As a user of our service, you are responsible for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Ensuring you have the right to share the files you upload</li>
                  <li>Not uploading files that violate any laws or regulations</li>
                  <li>Protecting your file access credentials</li>
                  <li>Respecting the intellectual property rights of others</li>
                  <li>Using the service in a manner that doesn't interfere with other users</li>
                </ul>
              </div>
            </div>

            {/* Prohibited Content */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-950/20 rounded-xl flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Prohibited Content</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>You may not upload, store, or share files that contain:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Illegal, harmful, or malicious content</li>
                  <li>Copyrighted material without permission</li>
                  <li>Malware, viruses, or other harmful code</li>
                  <li>Content that violates privacy or data protection laws</li>
                  <li>Material that promotes hate speech or discrimination</li>
                  <li>Content that could harm minors</li>
                </ul>
                <p>
                  We reserve the right to remove any content that violates these terms and suspend or terminate accounts of repeat violators.
                </p>
              </div>
            </div>

            {/* Service Availability */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/20 rounded-xl flex items-center justify-center">
                  <ServerIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Service Availability</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  While we strive to maintain high availability, our service is provided "as is" and "as available" without any warranties.
                </p>
                <p>We may need to temporarily suspend service for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Maintenance and updates</li>
                  <li>Security improvements</li>
                  <li>Infrastructure upgrades</li>
                  <li>Emergency situations</li>
                </ul>
                <p>
                  We will provide reasonable notice when possible, but some maintenance may be performed without prior notification.
                </p>
              </div>
            </div>

            {/* File Storage */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/20 rounded-xl flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">File Storage & Expiry</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Our file storage service includes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Temporary storage based on your selected expiry time</li>
                  <li>Automatic deletion when files expire</li>
                  <li>Manual deletion options at any time</li>
                  <li>Secure encryption during storage and transfer</li>
                </ul>
                <p>
                  Files are automatically removed from our servers when they expire. We recommend downloading important files before they expire.
                </p>
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-xl flex items-center justify-center">
                  <LockClosedIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Privacy & Data Protection</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy.
                </p>
                <p>We are committed to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Protecting your personal information</li>
                  <li>Using encryption for all data transfers</li>
                  <li>Not sharing your data with third parties</li>
                  <li>Complying with applicable data protection laws</li>
                </ul>
                <p>
                  Please review our Privacy Policy for detailed information about how we handle your data.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950/20 rounded-xl flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Limitation of Liability</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  In no event shall Droply, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
                </p>
                <p>This includes but is not limited to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Loss of profits, data, or use</li>
                  <li>Business interruption</li>
                  <li>Loss of business information</li>
                  <li>Any other pecuniary loss</li>
                </ul>
                <p>
                  Our total liability shall not exceed the amount paid by you, if any, for accessing our service.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Changes to Terms</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We reserve the right to modify these terms at any time. When we make changes, we will:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Update the "Last Modified" date at the bottom of this page</li>
                  <li>Notify users of significant changes when possible</li>
                  <li>Provide reasonable notice for major policy changes</li>
                </ul>
                <p>
                  Your continued use of the service after any changes constitutes acceptance of the new terms.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-xl flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Contact Information</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  If you have any questions about these Terms & Conditions, please contact us:
                </p>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="font-medium text-foreground">Support Team</p>
                  <p>Email: support@droply.com</p>
                  <p>Response Time: Within 24 hours</p>
                </div>
                <p>
                  We're here to help clarify any terms or address your concerns.
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center py-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
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
            By using our service, you agree to these terms. Start sharing files securely today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link 
              href="/upload" 
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Start Sharing Files
            </Link>
            <Link 
              href="/privacy" 
              className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold rounded-xl border-2 border-white transition-all duration-200"
            >
              Read Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
