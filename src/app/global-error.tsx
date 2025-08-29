'use client'

import { useEffect } from 'react'
import { 
  ExclamationTriangleIcon, 
  HomeIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400" />
            </div>
            
            {/* Error Message */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong!
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              We encountered an unexpected error. Our team has been notified and is working to fix it.
            </p>
            
            {/* Error Details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-xs font-mono text-gray-600 dark:text-gray-400 overflow-auto">
                  {error.message}
                  {error.digest && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                </div>
              </details>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Try Again
              </button>
              
              <a
                href="/"
                className="block w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                <HomeIcon className="w-5 h-5" />
                Go Home
              </a>
            </div>
            
            {/* Help Text */}
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              <p>If this problem persists, please contact our support team</p>
              <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                Get Support
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
