'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  DocumentIcon, 
  CalendarIcon,
  ClockIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  UserIcon,
  ArrowLeftIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatFileSize, getFileIcon, parseMetadata, detectFileType } from '@/lib/utils/ui'
import { PasswordProtectedDialog } from '@/components/PasswordProtectedDialog'
import { usePasswordProtection } from '@/hooks/usePasswordProtection'
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

export default function InfoPage() {
  const params = useParams()
  const fileId = params?.id as string
  
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    isPasswordDialogOpen,
    isVerifying,
    currentAction,
    openPasswordDialog,
    closePasswordDialog,
    handlePasswordSubmit
  } = usePasswordProtection({
    onPasswordSubmit: async (password: string) => {
      try {
        const result = await apiClient.get<FileInfo>(`/api/v1/info/${fileId}`, password);
        if (result.success && result.data) {
          setFileInfo(result.data);
          setIsLoading(false);
          setError(null);
          return true;
        }
        return false;
      } catch (error) {
        setError('Failed to fetch file info');
        setIsLoading(false);
        return false;
      }
    },
    onSuccess: () => {
      // File info already set in onPasswordSubmit
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
      setIsLoading(false);
    }
  });



  useEffect(() => {
    if (fileId) {
      const fetchFileInfo = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const result = await apiClient.get<FileInfo>(`/api/v1/info/${fileId}`) as ApiResponse;
          if (result.success && result.data) {
            setFileInfo(result.data);
            setIsLoading(false);
            setError(null);
          } else {
            // Check if password is required
            if (result.hasPassword === true) {
              setIsLoading(false);
              openPasswordDialog('view file information');
            } else {
              setError(result.error || 'Failed to fetch file info');
              setIsLoading(false);
            }
          }
        } catch (error) {
          setError('Failed to fetch file info');
          setIsLoading(false);
        }
      };
      
      fetchFileInfo();
    }
  }, [fileId, openPasswordDialog]);

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
          <h1 className="text-3xl font-bold text-foreground">File Information</h1>
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
          <h1 className="text-3xl font-bold text-foreground">File Information</h1>
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
          <h1 className="text-3xl font-bold text-foreground">File Information</h1>
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
              <h1 className="text-3xl font-bold text-foreground">File Information</h1>
              <p className="text-muted-foreground mt-2">View detailed file properties and metadata</p>
            </div>
          </div>
        </div>

        {/* File Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
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

            {/* Warning for non-password files */}
            {!fileInfo.hasPassword && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      ⚠️ Limited Access
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      This file has no password protection. You can view and download it, but cannot edit or delete it.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
          </CardContent>
        </Card>

        {/* File Properties Card */}
        <Card>
          <CardHeader>
            <CardTitle>File Properties</CardTitle>
            <CardDescription>Detailed file information and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File ID:</span>
                  <span className="text-sm font-medium font-mono">
                    {fileInfo.fileId}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expiration:</span>
                  <span className="text-sm font-medium">
                    {fileInfo.expiresAt 
                      ? new Date(fileInfo.expiresAt).toLocaleString()
                      : 'Never'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Download Limit:</span>
                  <span className="text-sm font-medium">
                    {fileInfo.maxDownloads ? fileInfo.maxDownloads.toString() : 'Unlimited'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Password Protected:</span>
                  <span className="text-sm font-medium">
                    {fileInfo.hasPassword ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Type:</span>
                  <span className="text-sm font-medium">
                    {fileInfo.isZipFile ? 'ZIP Archive' : 'Single File'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Checksum:</span>
                  <span className="text-sm font-medium font-mono">
                    {fileInfo.checksum ? `${fileInfo.checksum.substring(0, 16)}...` : 'Not available'}
                  </span>
                </div>
              </div>
            </div>

            {/* ZIP Metadata */}
            {fileInfo.isZipFile && fileInfo.meta && fileInfo.meta.length > 0 && (
              <>
                <Separator />
                <div>
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
              </>
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
            <a href={`/download/${fileInfo.fileId}`} target="_blank" rel="noopener noreferrer">
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Download File
            </a>
          </Button>
          
          <Button
            variant="outline"
            asChild
            disabled={!fileInfo.hasPassword}
            className="flex-1"
          >
            <a href={`/edit/${fileInfo.fileId}`} target="_blank" rel="noopener noreferrer">
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit File
            </a>
          </Button>
          
          <Button
            variant="outline"
            asChild
            disabled={!fileInfo.hasPassword}
            className="flex-1"
          >
            <a href={`/delete/file:${fileInfo.fileId}`} target="_blank" rel="noopener noreferrer">
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete File
            </a>
          </Button>
        </div>

        {/* Action Limitations Notice */}
        {!fileInfo.hasPassword && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <LockClosedIcon className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Limited Actions Available</h3>
                <p className="text-muted-foreground mb-4">
                  This file has no password protection, so editing and deletion are not available. 
                  Only the original uploader can modify files without passwords.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Password Dialog */}
      <PasswordProtectedDialog
        isOpen={isPasswordDialogOpen}
        onClose={closePasswordDialog}
        onSubmit={handlePasswordSubmit}
        title="Password Required"
        description="This file is password protected. Please enter the password to view its details."
        isLoading={isVerifying}
      />
    </>
  )
}
