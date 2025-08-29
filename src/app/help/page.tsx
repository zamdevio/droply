'use client'

import { 
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  BookOpenIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

export default function HelpPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help Center</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Find answers to common questions and get support
        </p>
      </div>

      {/* Quick Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
          🚀 Quick Help
        </h2>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          Need help fast? Check our frequently asked questions below or contact our support team.
        </p>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              How do I upload a file?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Simply drag and drop your file onto the upload area or click to browse and select a file. 
              You can also set optional parameters like password protection, expiration date, and download limits.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              What file types are supported?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We support most common file types including images, documents, videos, and archives. 
              The maximum file size is 100MB. For security reasons, some executable files may be restricted.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              How long do files stay available?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              By default, files expire after 7 days. You can set custom expiration times up to 30 days, 
              or choose to keep files indefinitely. Password-protected files don't expire automatically.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Is my data secure?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes! We use enterprise-grade encryption and secure infrastructure. Files are stored on 
              Cloudflare R2 with military-grade security. We don't track or collect personal information.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Can I delete my files?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Absolutely! You can delete any file you've uploaded at any time. Deleted files are 
              permanently removed from our servers and cannot be recovered.
            </p>
          </div>
        </div>
      </div>

      {/* Support Options */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get Support</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Documentation</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Browse our comprehensive API documentation and guides
            </p>
            <a href="/docs" className="text-blue-600 dark:text-blue-400 hover:underline">
              View Docs →
            </a>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Live Chat</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Chat with our support team in real-time
            </p>
            <button className="text-green-600 dark:text-green-400 hover:underline">
              Start Chat →
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Send us an email and we'll get back to you
            </p>
            <a href="mailto:support@droply.com" className="text-purple-600 dark:text-purple-400 hover:underline">
              Send Email →
            </a>
          </div>
        </div>
      </div>

      {/* Tips & Tricks */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
            <LightBulbIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100">Pro Tips</h2>
        </div>
        
        <div className="space-y-3 text-yellow-800 dark:text-yellow-200">
          <p>• Use password protection for sensitive files</p>
          <p>• Set download limits to control file access</p>
          <p>• Use descriptive filenames for better organization</p>
          <p>• Check file expiration dates regularly</p>
        </div>
      </div>
    </div>
  )
}
