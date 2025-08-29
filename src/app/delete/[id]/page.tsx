'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SkeletonFileInfo } from '@/components/layout/Skeleton'
import { FileInfo } from '@/types/file'
import { 
  DocumentIcon, 
  ExclamationTriangleIcon,
  TrashIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

export default function Delete() {
  const params = useParams()
  const router = useRouter()
  const [info, setInfo] = useState<FileInfo | null>(null)
  const [status, setStatus] = useState<'loading' | 'confirm' | 'deleting' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchFileInfo = async () => {
      try {
        const response = await fetch(`/api/v1/info/${params.id}`)
        if (!response.ok) {
          throw new Error('File not found')
        }
        const data = await response.json()
        setInfo(data.file)
        setStatus('confirm')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file info')
        setStatus('error')
      }
    }

    if (params.id) {
      fetchFileInfo()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!info || !password.trim()) return

    setIsDeleting(true)
    setStatus('deleting')
    
    try {
      const response = await fetch(`/api/v1/delete/${info.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      setStatus('success')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setStatus('error')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (status === 'loading') {
    return <SkeletonFileInfo />
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Error
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error || 'An error occurred while loading the file.'}
        </p>
        <Button onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          File Deleted Successfully!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The file "{info?.name}" has been permanently removed from the system.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/upload')}>
            Upload New File
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'deleting') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <TrashIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Deleting File...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we securely remove your file from the system.
        </p>
      </div>
    )
  }

  if (status === 'confirm' && info) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        {/* Warning Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrashIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            Delete File
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This action cannot be undone. Please confirm your decision.
          </p>
        </div>

        {/* File Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DocumentIcon className="w-5 h-5" />
            File to be Deleted
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="font-medium text-gray-900 dark:text-white">{info.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="font-medium text-gray-900 dark:text-white">{info.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Size:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatFileSize(info.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Uploaded:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(info.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Downloads:</span>
              <span className="font-medium text-gray-900 dark:text-white">{info.downloadCount}</span>
            </div>
          </div>
        </div>

        {/* Password Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Confirm Deletion
          </h3>
          
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium mb-1">⚠️ Warning</p>
                <p>
                  Deleting this file will permanently remove it from our servers. 
                  This action cannot be undone and all download links will become invalid.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              File Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter file password to confirm deletion"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Password is required to confirm file deletion
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDelete}
              disabled={isDeleting || !password.trim()}
              variant="destructive"
              size="lg"
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete File Permanently
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isDeleting}
              size="lg"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">🔒 Security Notice</p>
              <p>
                File deletion requires the original password for verification. 
                This ensures only the file owner can remove their files.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
