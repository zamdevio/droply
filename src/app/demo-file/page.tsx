'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PasswordVerification } from '@/components/PasswordVerification'
import { 
  DocumentIcon,
  EyeIcon,
  LockClosedIcon,
  CalendarIcon,
  DownloadIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { 
  fileStore, 
  FileAccessControl, 
  FileSessionManager,
  formatFileSize,
  getFileIcon 
} from '@/lib/fileStorage'

// Demo file data
const DEMO_FILE = {
  id: 'demo123',
  name: 'confidential-report.pdf',
  type: 'application/pdf',
  size: 2048576, // 2MB
  visibility: 'private' as const,
  createdAt: '2024-01-15T10:30:00Z',
  expiresAt: '2024-04-15T10:30:00Z',
  maxDownloads: 5,
  downloadCount: 2,
  checksum: 'sha256_demo_abc123'
}

export default function DemoFilePage() {
  const [hasValidPassword, setHasValidPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'download' | 'info' | 'edit' | 'delete'>('info')
  const [isExpired, setIsExpired] = useState(false)
  const [canDownload, setCanDownload] = useState(false)

  useEffect(() => {
    // Check if file is expired
    setIsExpired(FileAccessControl.isFileExpired(DEMO_FILE))
    setCanDownload(FileAccessControl.canDownload(DEMO_FILE))
  }, [])

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    // For demo, accept any password
    if (password.trim()) {
      // Create a session
      FileSessionManager.createSession(DEMO_FILE.id, password)
      setHasValidPassword(true)
      setShowPasswordForm(false)
      return true
    }
    return false
  }

  const handleAction = (action: 'download' | 'info' | 'edit' | 'delete') => {
    const requiresPassword = FileAccessControl.canAccessFile(
      DEMO_FILE, 
      action, 
      hasValidPassword
    )

    if (requiresPassword && !hasValidPassword) {
      setPasswordAction(action)
      setShowPasswordForm(true)
    } else {
      // Handle the action
      console.log(`Performing action: ${action}`)
    }
  }

  const getStatusColor = () => {
    if (isExpired) return 'text-red-600 dark:text-red-400'
    if (canDownload) return 'text-green-600 dark:text-green-400'
    return 'text-yellow-600 dark:text-yellow-400'
  }

  const getStatusText = () => {
    if (isExpired) return 'Expired'
    if (canDownload) return 'Available'
    return 'Download Limit Reached'
  }

  const getStatusIcon = () => {
    if (isExpired) return <ExclamationTriangleIcon className="w-5 h-5" />
    if (canDownload) return <CheckCircleIcon className="w-5 h-5" />
    return <ExclamationTriangleIcon className="w-5 h-5" />
  }

  if (showPasswordForm) {
    return (
      <PasswordVerification
        fileId={DEMO_FILE.id}
        fileName={DEMO_FILE.name}
        onVerify={handlePasswordVerify}
        onSuccess={() => setShowPasswordForm(false)}
        action={passwordAction}
        isRequired={true}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <DocumentIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          File Information
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Secure file details with privacy controls
        </p>
      </div>

      {/* File Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">{getFileIcon(DEMO_FILE.type)}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {DEMO_FILE.name}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                DEMO_FILE.visibility === 'public' 
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
              }`}>
                {DEMO_FILE.visibility === 'public' ? 'Public' : 'Private'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Size:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {formatFileSize(DEMO_FILE.size)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {DEMO_FILE.type}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Downloads:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {DEMO_FILE.downloadCount}/{DEMO_FILE.maxDownloads || '∞'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`ml-2 font-medium flex items-center gap-1 ${getStatusColor()}`}>
                  {getStatusIcon()}
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* File Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Created:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(DEMO_FILE.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Expires:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(DEMO_FILE.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <LockClosedIcon className="w-5 h-5 text-gray-500" />
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Access:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {hasValidPassword ? 'Password Verified' : 'Password Required'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <EyeIcon className="w-5 h-5 text-gray-500" />
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Visibility:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {DEMO_FILE.visibility === 'public' 
                    ? 'Anyone can download' 
                    : 'Password required for all actions'
                  }
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DownloadIcon className="w-5 h-5 text-gray-500" />
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Download Limit:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {DEMO_FILE.maxDownloads ? `${DEMO_FILE.maxDownloads} downloads` : 'Unlimited'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DocumentIcon className="w-5 h-5 text-gray-500" />
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Checksum:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                  {DEMO_FILE.checksum}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          File Actions
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            onClick={() => handleAction('download')}
            disabled={!canDownload}
            className="w-full"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download
          </Button>
          
          <Button
            onClick={() => handleAction('info')}
            variant="outline"
            className="w-full"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Info
          </Button>
          
          <Button
            onClick={() => handleAction('edit')}
            variant="outline"
            className="w-full"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Button>
          
          <Button
            onClick={() => handleAction('delete')}
            variant="outline"
            className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        {!hasValidPassword && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <LockClosedIcon className="w-4 h-4" />
              <span className="text-sm">
                Some actions require password verification. Click any action button to enter the password.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          🔒 Privacy & Security Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-medium mb-2">Password Protection</h4>
            <ul className="text-sm space-y-1">
              <li>• All files require passwords for sensitive actions</li>
              <li>• Passwords are securely hashed and never stored in plain text</li>
              <li>• Session management prevents repeated password entry</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Access Control</h4>
            <ul className="text-sm space-y-1">
              <li>• Public files: Download without password, edit/delete with password</li>
              <li>• Private files: All actions require password</li>
              <li>• Automatic expiration and download limits</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Share This File
        </h3>
        
        <div className="flex gap-3">
          <input
            type="text"
            value={`${window.location.origin}/download/${DEMO_FILE.id}`}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
          />
          <Button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/download/${DEMO_FILE.id}`)}
            variant="outline"
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Share this link with others. They'll need the password to access the file.
        </p>
      </div>
    </div>
  )
}
