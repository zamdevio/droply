'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  DocumentIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatFileSize, getFileIcon } from '@/lib/localFileStorage'
import PasswordDialog from '@/components/PasswordDialog'
import { usePasswordProtectedAPI } from '@/hooks/usePasswordProtectedAPI'
import { apiClient } from '@/lib/client/api'

interface FileInfo {
  fileId: string
  originalName: string
  contentType: string
  size: number
  uploadDate: string
  expiresAt: string | null
  status: 'active' | 'expired' | 'deleted' | 'blocked'
  downloadCount: number
  maxDownloads: number | null
  isZipFile: boolean
  hasPassword: boolean
  checksum: string
  meta: FileMeta[] | null
  sizeBytes: string
  passwordHash: string | null
}

interface FileMeta {
  name: string
  size: number
  type: string
  checksum: string
}

interface ApiResponse {
  success: boolean
  data?: FileInfo
  error?: string
  message?: string
  hasPassword?: boolean
  canEdit?: boolean
  canDelete?: boolean
  ownershipInfo?: string
}

export default function DeletePage() {
  const params = useParams()
  const router = useRouter()
  const fileId = params?.id as string
  
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const {
    isPasswordDialogOpen,
    fileId: dialogFileId,
    handleApiCall: hookHandleApiCall,
    handlePasswordSubmit: hookHandlePasswordSubmit,
    closePasswordDialog
  } = usePasswordProtectedAPI<FileInfo>()

  useEffect(() => {
    if (fileId) {
      hookHandleApiCall(
        async (password?: string) => {
          setIsLoading(true)
          setError(null)
          
          const result = await apiClient.get<FileInfo>(`/api/v1/info/${fileId}`, password)
          return result
        },
        (data) => {
          setFileInfo(data)
          setIsLoading(false)
          setError(null)
        },
        (err) => {
          setError(err)
          setIsLoading(false)
        }
      )
    }
  }, [fileId, hookHandleApiCall])

  const handleDelete = async () => {
    if (!fileInfo) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileInfo.originalName}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setIsDeleting(true)
    
    try {
      // Use the hook to handle the delete API call
      await hookHandleApiCall(
        async (password?: string) => {
          const result = await apiClient.delete(`/api/v1/delete/${fileId}`, password)
          return result
        },
        () => {
          setDeleteSuccess(true)
          toast.success('File deleted successfully!')
        },
        (err) => {
          toast.error(err)
        }
      )
    } catch (err) {
      console.error('Error deleting file:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete file')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'expired':
        return <XCircleIcon className="w-5 h-5 text-red-600" />
      case 'deleted':
        return <XCircleIcon className="w-5 h-5 text-red-600" />
      case 'blocked':
        return <XCircleIcon className="w-5 h-5 text-red-600" />
      case 'unknown':
        return <DocumentIcon className="w-5 h-5 text-gray-600" />
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      case 'expired':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      case 'deleted':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      case 'blocked':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      case 'unknown':
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold text-foreground">Delete File</h1>
          <p className="text-muted-foreground mt-2">Loading file details...</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold text-foreground">Delete File</h1>
          <p className="text-muted-foreground mt-2">Unable to load file details</p>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading File</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          
          <div className="mt-6">
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!fileInfo) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold text-foreground">Delete File</h1>
          <p className="text-muted-foreground mt-2">No file data available</p>
        </div>
        
        <div className="text-center py-12">
          <DocumentIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No File Data</h3>
          <p className="text-muted-foreground mb-6">Unable to retrieve file information</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (deleteSuccess) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold text-foreground">File Deleted</h1>
          <p className="text-muted-foreground mt-2">File has been successfully removed</p>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">File Deleted Successfully</h3>
          <p className="text-muted-foreground mb-6">
            "{fileInfo.originalName}" has been permanently deleted from the system.
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button variant="outline" asChild>
              <a href="/upload">
                Upload New File
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Delete File</h1>
              <p className="text-muted-foreground mt-2">Permanently remove this file from the system</p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                ⚠️ Warning: This action cannot be undone
              </h3>
              <p className="text-red-800 dark:text-red-200">
                Deleting this file will permanently remove it from the system. 
                All download links will become invalid, and the file cannot be recovered.
              </p>
            </div>
          </div>
        </div>

        {/* Warning for non-password files */}
        {!fileInfo.hasPassword && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-amber-600 dark:text-amber-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  ⚠️ This file cannot be deleted
                </h3>
                <p className="text-amber-800 dark:text-amber-200">
                  Files without password protection cannot be deleted. Only password-protected files can be removed from the system.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{getFileIcon(fileInfo.contentType)}</span>
              </div>
              <div>
                <div className="text-xl font-bold">{fileInfo.originalName}</div>
                <div className="text-sm text-muted-foreground font-normal">
                  {fileInfo.contentType}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status and Protection */}
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(fileInfo.status || 'unknown')}>
                <span className="flex items-center gap-2">
                  {getStatusIcon(fileInfo.status || 'unknown')}
                  {(fileInfo.status || 'unknown').charAt(0).toUpperCase() + (fileInfo.status || 'unknown').slice(1)}
                </span>
              </Badge>
              
              {fileInfo.hasPassword && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <LockClosedIcon className="w-4 h-4" />
                  Password Protected
                </Badge>
              )}
              
              {fileInfo.isZipFile && (
                <Badge variant="outline" className="flex items-center gap-2">
                  <ArchiveBoxIcon className="w-4 h-4" />
                  ZIP Archive
                </Badge>
              )}
            </div>

            {/* File Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DocumentIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{formatFileSize(fileInfo.size)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Upload:</span>
                <span className="font-medium">
                  {new Date(fileInfo.uploadDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <ArrowDownTrayIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Downloads:</span>
                <span className="font-medium">{fileInfo.downloadCount || 0}</span>
              </div>
            </div>

            {/* ZIP Metadata */}
            {fileInfo.isZipFile && fileInfo.meta && fileInfo.meta.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ArchiveBoxIcon className="w-4 h-4" />
                  Archive Contents ({fileInfo.meta.length} files)
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {fileInfo.meta.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <span className="font-medium">{file.name || 'Unknown'}</span>
                      <span className="text-muted-foreground">
                        {file.size ? formatFileSize(file.size) : 'Unknown size'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            asChild
            className="flex-1"
          >
            <a href={`/info/${fileInfo.fileId}`} target="_blank" rel="noopener noreferrer">
              <EyeIcon className="w-4 h-4 mr-2" />
              View File Info
            </a>
          </Button>
          
          <Button
            variant="outline"
            asChild
            className="flex-1"
          >
            <a href={`/download/${fileInfo.fileId}`} target="_blank" rel="noopener noreferrer">
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Download File
            </a>
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !fileInfo.hasPassword}
            className="flex-1"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            {!fileInfo.hasPassword ? 'Cannot Delete' : (isDeleting ? 'Deleting...' : 'Delete File')}
          </Button>
        </div>

        {/* Final Warning */}
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Are you absolutely sure you want to delete this file?
              </p>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone and will permanently remove the file from the system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Dialog */}
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={closePasswordDialog}
        onSubmit={hookHandlePasswordSubmit}
        title="Password Required"
        description="This file is password protected. Please enter the password to delete it."
        fileId={dialogFileId || undefined}
      />
    </>
  )
}
