'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  CheckIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface EditFormData {
  expiresAt: string
  maxDownloads: string
  password: string
  newPassword: string
  confirmPassword: string
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

export default function EditPage() {
  const params = useParams()
  const router = useRouter()
  const fileId = params?.id as string
  
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState<EditFormData>({
    expiresAt: '',
    maxDownloads: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  })

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
          setError(null)
          
          // Initialize form data
          setFormData({
            expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : '',
            maxDownloads: data.maxDownloads?.toString() || '',
            password: data.hasPassword ? formData.password : '',
            newPassword: '',
            confirmPassword: ''
          })
          setIsLoading(false)
        },
        (err) => {
          setError(err)
          setIsLoading(false)
        }
      )
    }
  }, [fileId, hookHandleApiCall])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    setIsSaving(true)
    
    try {
      const updateData: any = {}
      
      if (formData.expiresAt) {
        updateData.expiresAt = new Date(formData.expiresAt).toISOString()
      } else if (formData.expiresAt === '') {
        updateData.expiresAt = null
      }
      
      if (formData.maxDownloads) {
        const maxDownloads = parseInt(formData.maxDownloads)
        if (maxDownloads > 0) {
          updateData.maxDownloads = maxDownloads
        } else {
          updateData.maxDownloads = null
        }
      } else if (formData.maxDownloads === '') {
        updateData.maxDownloads = null
      }
      
      if (formData.newPassword) {
        updateData.password = formData.newPassword
      }



      const result = await apiClient.put(`/api/v1/edit/${fileId}`, updateData, formData.password)

      if (result.success) {
        toast.success('File updated successfully!')
        
        // Refresh file info
        await hookHandleApiCall(
          async (password?: string) => {
            const result = await apiClient.get<FileInfo>(`/api/v1/info/${fileId}`, password)
            return result
          },
          (data) => {
            setFileInfo(data)
            setFormData(prev => ({
              ...prev,
              expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : '',
              maxDownloads: data.maxDownloads?.toString() || '',
              password: formData.password,
              newPassword: '',
              confirmPassword: ''
            }))
          },
          (err) => {
            setError(err)
          }
        )
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        // Handle specific API errors
        if (result.error === 'No password protection') {
          toast.error('This file cannot be edited because it has no password protection')
        } else if (result.error === 'Password required') {
          toast.error('Password is required to edit this file')
        } else if (result.error === 'Invalid password') {
          toast.error('Incorrect password. Please try again.')
        } else {
          throw new Error(result.error || result.message || 'Failed to update file')
        }
      }
    } catch (err) {
      console.error('Error updating file:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update file')
    } finally {
      setIsSaving(false)
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
          <h1 className="text-3xl font-bold text-foreground">Edit File</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Edit File</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Edit File</h1>
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
              <h1 className="text-3xl font-bold text-foreground">Edit File</h1>
              <p className="text-muted-foreground mt-2">Modify file settings and properties</p>
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
                      ⚠️ This file cannot be edited
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Files without password protection cannot be modified. Only the original uploader can access them.
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

        {/* Edit Form - Only show for password-protected files */}
        {fileInfo.hasPassword ? (
          <Card>
            <CardHeader>
              <CardTitle>File Settings</CardTitle>
              <CardDescription>Modify file expiration, download limits, and password protection</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Expiration Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Expiration Settings
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">Expiration Date & Time</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={formData.expiresAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                        placeholder="Never expire"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for no expiration
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxDownloads">Maximum Downloads</Label>
                      <Input
                        id="maxDownloads"
                        type="number"
                        min="1"
                        value={formData.maxDownloads}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxDownloads: e.target.value }))}
                        placeholder="Unlimited"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for unlimited downloads
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  {/* Password Protection */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <LockClosedIcon className="w-4 h-4" />
                      Password Protection
                    </h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter current password to make changes"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Required to modify password-protected files
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password (Optional)</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Leave empty to keep current password"
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters. Leave empty to keep current password.
                      </p>
                    </div>
                    
                    {formData.newPassword && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSaving || !formData.password}
                    className="flex items-center gap-2"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <LockClosedIcon className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Editing Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  This file has no password protection and cannot be modified. 
                  Only password-protected files can be edited or deleted.
                </p>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current File Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current File Information</CardTitle>
            <CardDescription>View current file status and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Expiration:</span>
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
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Downloads:</span>
                  <span className="text-sm font-medium">{fileInfo.downloadCount || 0}</span>
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
                <div className="border-t border-border pt-6">
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <ArchiveBoxIcon className="w-4 h-4" />
                      Archive Contents ({fileInfo.meta.length} files)
                    </h5>
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Password Dialog */}
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={closePasswordDialog}
        onSubmit={hookHandlePasswordSubmit}
        title="Password Required"
        description="This file is password protected. Please enter the password to edit it."
        fileId={dialogFileId || undefined}
      />
    </>
  )
}
