'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface PasswordVerificationProps {
  fileId: string
  fileName: string
  onVerify: (password: string) => Promise<boolean>
  onSuccess: () => void
  action: 'download' | 'info' | 'edit' | 'delete'
  isRequired: boolean
}

export function PasswordVerification({ 
  fileId, 
  fileName, 
  onVerify, 
  onSuccess, 
  action, 
  isRequired 
}: PasswordVerificationProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsVerifying(true)
    setError(null)

    try {
      const isValid = await onVerify(password.trim())
      if (isValid) {
        onSuccess()
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const getActionIcon = () => {
    switch (action) {
      case 'download': return '⬇️'
      case 'info': return 'ℹ️'
      case 'edit': return '✏️'
      case 'delete': return '🗑️'
      default: return '🔒'
    }
  }

  const getActionText = () => {
    switch (action) {
      case 'download': return 'Download'
      case 'info': return 'View Info'
      case 'edit': return 'Edit'
      case 'delete': return 'Delete'
      default: return 'Access'
    }
  }

  const getActionDescription = () => {
    switch (action) {
      case 'download': return 'Enter the password to download this file'
      case 'info': return 'Enter the password to view file information'
      case 'edit': return 'Enter the password to edit this file'
      case 'delete': return 'Enter the password to delete this file'
      default: return 'Enter the password to access this file'
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">{getActionIcon()}</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Password Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {getActionDescription()}
        </p>
      </div>

      {/* File Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">📎</span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              File ID: {fileId}
            </p>
          </div>
        </div>
      </div>

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter file password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isVerifying}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={isVerifying}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!password.trim() || isVerifying}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            <>
              <ShieldCheckIcon className="w-4 h-4 mr-2" />
              {getActionText()}
            </>
          )}
        </Button>
      </form>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <LockClosedIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">🔒 Security Notice</p>
            <p>
              {isRequired 
                ? 'This action requires the file password for security reasons.'
                : 'Password verification ensures only authorized users can perform this action.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
