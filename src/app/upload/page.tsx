'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  CloudArrowUpIcon, 
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { localFileStorage, LocalFileInfo } from '@/lib/localFileStorage'
import { toast } from 'sonner'
import { initializeCompression, FileMeta } from '@/wasm/index'
import { generateSmartFilename } from '@/lib/utils/file-extensions'

interface UploadedFile {
  file: File
  checksum: string
  id: string
}

// 🔥 NEW: Use the correct FileMeta type from WASM
interface FileMeta {
  name: string
  originalSize: number
  relativePath?: string
  originalName?: string
}

// Helper function to calculate SHA-256 checksum
async function calculateChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [password, setPassword] = useState('')
  const [expiresIn, setExpiresIn] = useState<'1h' | '1d' | '7d' | '30d' | 'never'>('7d')
  const [maxDownloads, setMaxDownloads] = useState<number>(10)
  const [isUploading, setIsUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [zipFileName, setZipFileName] = useState('compressed-files.zip')
  
  // New state for upload success and response
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadResponse, setUploadResponse] = useState<any>(null)

  // Helper function to calculate total size
  const getTotalSize = () => {
    return uploadedFiles.reduce((total, fileData) => total + fileData.file.size, 0)
  }

  const getTotalSizeMB = () => {
    return getTotalSize() / 1024 / 1024
  }

  const getRemainingMB = () => {
    return 100 - getTotalSizeMB()
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Don't accept files if currently uploading
    if (isUploading) {
      toast.error('Please wait for the current upload to complete before adding more files')
      return
    }

    // Check if any file is larger than 100MB
    const oversizedFiles = acceptedFiles.filter(file => file.size > 100 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(`Files larger than 100MB are not allowed: ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }

    // Check if any file is a ZIP (we don't allow uploading existing ZIPs)
    const zipFiles = acceptedFiles.filter(file => file.type === 'application/zip')
    if (zipFiles.length > 0) {
      toast.error('Please select individual files to compress, not ZIP files')
      return
    }

    // Calculate checksums and check for duplicates
    const filesWithChecksums = await Promise.all(
      acceptedFiles.map(async (file) => {
        const checksum = await calculateChecksum(file)
        return { file, checksum }
      })
    )

    // Check for duplicates against existing files
    const existingChecksums = uploadedFiles.map(uf => uf.checksum)
    const duplicateFiles = filesWithChecksums.filter(({ checksum }) => 
      existingChecksums.includes(checksum)
    )

    if (duplicateFiles.length > 0) {
      const duplicateNames = duplicateFiles.map(({ file }) => file.name).join(', ')
      toast.error(`Duplicate files detected: ${duplicateNames}`, {
        description: 'These files are already in your upload list'
      })
      
      // Remove duplicate files from the list
      const uniqueFiles = filesWithChecksums.filter(({ checksum }) => 
        !existingChecksums.includes(checksum)
      )
      
      if (uniqueFiles.length === 0) {
        toast.info('All selected files are duplicates')
        return
      }
      
      toast.info(`Added ${uniqueFiles.length} new files, skipped ${duplicateFiles.length} duplicates`)
      acceptedFiles = uniqueFiles.map(({ file }) => file)
      filesWithChecksums.splice(0, filesWithChecksums.length, ...uniqueFiles)
    }

    // Calculate total size of new files + existing files
    const existingSize = getTotalSize()
    const newFilesSize = acceptedFiles.reduce((total, file) => total + file.size, 0)
    const totalSize = existingSize + newFilesSize

    // If total size exceeds 100MB, remove extra files to stay under limit
    if (totalSize > 100 * 1024 * 1024) {
      const maxAllowedSize = 100 * 1024 * 1024
      let currentSize = existingSize
      const filesToKeep: typeof filesWithChecksums = []
      
      // Keep files until we hit the limit
      for (const fileData of filesWithChecksums) {
        if (currentSize + fileData.file.size <= maxAllowedSize) {
          filesToKeep.push(fileData)
          currentSize += fileData.file.size
        } else {
          break
        }
      }

      if (filesToKeep.length === 0) {
        toast.error('No files can be added - would exceed 100MB total limit')
        return
      }

      if (filesToKeep.length < filesWithChecksums.length) {
        const removedCount = filesWithChecksums.length - filesToKeep.length
        toast.warning(`Removed ${removedCount} file(s) to stay under 100MB limit`)
        filesWithChecksums.splice(0, filesWithChecksums.length, ...filesToKeep)
        acceptedFiles = filesToKeep.map(({ file }) => file)
      }
    }

    const newFiles = filesWithChecksums.map(({ file, checksum }) => ({
      file,
      progress: 0,
      status: 'pending' as const,
      checksum,
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Success message for added files
    toast.success(`Added ${newFiles.length} file(s) to upload list`, {
      description: `Total files: ${uploadedFiles.length + newFiles.length}`
    })
    
    // Auto-generate ZIP filename if multiple files
    if (uploadedFiles.length + acceptedFiles.length > 1) {
      const totalFiles = uploadedFiles.length + acceptedFiles.length
      if (totalFiles === 2) {
        const firstFile = uploadedFiles[0]?.file || acceptedFiles[0]
        const secondFile = uploadedFiles[1]?.file || acceptedFiles[1] || acceptedFiles[0]
        const baseName = `${firstFile.name.split('.')[0]}-${secondFile.name.split('.')[0]}`
        setZipFileName(`${baseName}.zip`)
      } else {
        setZipFileName(`multiple-files-${totalFiles}.zip`)
      }
    }
  }, [isUploading, uploadedFiles, getTotalSize])

  // 🔥 NEW: Update filename based on compression settings
  const updateZipFileName = useCallback((files: File[], compressionAlgo: string = 'zip') => {
    if (files.length === 1) {
      const baseName = files[0].name.replace(/\.[^/.]+$/, '')
      // Single file: use compression algorithm extension
      const newFileName = generateSmartFilename(baseName, {
        archive: 'none',
        compression: compressionAlgo as any,
        timestamp: false
      })
      setZipFileName(newFileName)
    } else {
      // Multiple files: use archive format
      const newFileName = generateSmartFilename('multiple-files', {
        archive: 'zip',
        compression: 'none',
        timestamp: false
      })
      setZipFileName(newFileName)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts', '.py', '.java', '.cpp', '.c'],
      'application/*': ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true, // Allow multiple files
  })

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) return

    setIsUploading(true)
    const updatedFiles = [...uploadedFiles]

    try {
      let fileToUpload: File
      let metadata: FileMeta[] | null = null
      let isSingleFile = uploadedFiles.length === 1

      // If we have multiple files, compress them into a ZIP
      if (uploadedFiles.length > 1) {
        // Update status to compressing for all files
        updatedFiles.forEach((_, index) => {
          updatedFiles[index] = { ...updatedFiles[index], status: 'compressing', progress: 10 }
        })
        setUploadedFiles([...updatedFiles])

        const files = uploadedFiles.map(uf => uf.file)
        const { zipBlob, meta } = await initializeCompression().compress_files(files)
        
        // Create a new File object from the ZIP blob with user-defined name
        fileToUpload = new File([zipBlob], zipFileName, { type: 'application/zip' })
        metadata = meta
        
        // Update progress for all files
        updatedFiles.forEach((_, index) => {
          updatedFiles[index] = { ...updatedFiles[index], status: 'compressing', progress: 50, meta: metadata || undefined }
        })
        setUploadedFiles([...updatedFiles])
      } else {
        // Single file upload
        fileToUpload = uploadedFiles[0].file
        isSingleFile = true
      }

      // Update status to uploading for all files
      updatedFiles.forEach((_, index) => {
        updatedFiles[index] = { ...updatedFiles[index], status: 'uploading', progress: 60 }
      })
      setUploadedFiles([...updatedFiles])

      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('isSingleFile', isSingleFile.toString())
      
      // Add password only if it's not empty
      if (password && password.trim() !== '') {
        formData.append('password', password.trim())
        }
        
        formData.append('expiresIn', expiresIn)
        if (maxDownloads) {
          formData.append('maxDownloads', maxDownloads.toString())
        }

      // Add metadata if we have it (for ZIP files)
      if (metadata && metadata.length > 0) {
        formData.append('meta', JSON.stringify(metadata))
      }

      // Add checksum - for single files use file checksum, for ZIP use ZIP checksum
      if (isSingleFile) {
        formData.append('checksum', uploadedFiles[0].checksum)
      } else {
        // Calculate ZIP checksum
        const zipChecksum = await calculateChecksum(fileToUpload)
        formData.append('checksum', zipChecksum)
        }

        // Update progress
      updatedFiles.forEach((_, index) => {
        updatedFiles[index] = { ...updatedFiles[index], status: 'uploading', progress: 80 }
      })
        setUploadedFiles([...updatedFiles])

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          // Store file info locally for later access
          const localFileInfo: LocalFileInfo = {
            fileId: result.data.fileId,
            originalName: result.data.originalName,
            size: result.data.size,
            contentType: result.data.contentType,
            uploadDate: result.data.uploadDate,
            expiresAt: result.data.expiresAt,
            maxDownloads: result.data.maxDownloads,
            hasPassword: result.data.hasPassword,
            expiryInfo: result.data.expiryInfo,
          }

          localFileStorage.addFile(localFileInfo)

        // Update progress and status for all files
        updatedFiles.forEach((_, index) => {
          updatedFiles[index] = { 
            ...updatedFiles[index], 
            progress: 100, 
            status: 'success',
            result,
            meta: metadata || undefined
          }
        })
          setUploadedFiles([...updatedFiles])

        // Set upload success and store response
        setUploadSuccess(true)
        setUploadResponse(result.data)

        const successMessage = metadata 
          ? `Compressed ${metadata.length} files uploaded successfully as "${zipFileName}"!`
          : `File "${result.data.originalName}" uploaded successfully!`

        toast.success(successMessage, {
            description: `File ID: ${result.data.fileId}`,
            action: {
              label: 'Copy ID',
              onClick: () => {
                navigator.clipboard.writeText(result.data.fileId)
                toast.success('File ID copied to clipboard!')
              }
            }
          })

        } else {
          throw new Error(result.error || 'Upload failed')
        }

      } catch (error) {
        console.error('Upload error:', error)
      
      // Update all files to error status
      updatedFiles.forEach((_, index) => {
        updatedFiles[index] = { 
          ...updatedFiles[index], 
          progress: 0, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      })
        setUploadedFiles([...updatedFiles])

      const errorMessage = uploadedFiles.length > 1 
        ? `Failed to upload compressed files`
        : `Failed to upload "${uploadedFiles[0].file.name}"`

      toast.error(errorMessage, {
          description: error instanceof Error ? error.message : 'Upload failed'
        })
    }

    setIsUploading(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploadedFiles([])
    setPassword('')
    setExpiresIn('7d')
    setMaxDownloads(10)
    setShowPassword(false)
    setZipFileName('compressed-files.zip')
    setUploadSuccess(false)
    setUploadResponse(null)
  }

  const startNewUpload = () => {
    setUploadSuccess(false)
    setUploadResponse(null)
    setUploadedFiles([])
    setPassword('')
    setExpiresIn('7d')
    setMaxDownloads(10)
    setShowPassword(false)
    setZipFileName('compressed-files.zip')
  }

  // Success UI Component
  const UploadSuccessUI = () => {
    if (!uploadResponse) return null

    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Upload Successful! 🎉
          </h2>
          <p className="text-lg text-muted-foreground">
            Your file has been uploaded and is ready to share
          </p>
        </div>

        {/* File Information Card */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <DocumentIcon className="w-5 h-5" />
              File Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">File Name</Label>
                <p className="text-foreground font-medium">{uploadResponse.originalName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">File ID</Label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {uploadResponse.fileId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(uploadResponse.fileId)
                      toast.success('File ID copied!')
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Size</Label>
                <p className="text-foreground">{(uploadResponse.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                <p className="text-foreground">{uploadResponse.contentType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Expires</Label>
                <p className="text-foreground">{uploadResponse.expiryInfo}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Max Downloads</Label>
                <p className="text-foreground">{uploadResponse.maxDownloads || 'Unlimited'}</p>
              </div>
            </div>

            {/* Additional File Info */}
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Type</Label>
                  <p className="text-foreground">
                    {uploadResponse.isZipFile ? 'ZIP Archive' : 'Single File'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Compression</Label>
                  <p className="text-foreground">{uploadResponse.compressionInfo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ownership</Label>
                  <p className="text-foreground">{uploadResponse.ownershipNote}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Upload Date</Label>
                  <p className="text-foreground">{uploadResponse.uploadDate}</p>
                </div>
              </div>
            </div>

            {uploadResponse.meta && uploadResponse.meta.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-muted-foreground">Compressed Files</Label>
                <div className="mt-2 space-y-2">
                  {uploadResponse.meta.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Links Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Access your file or share it with others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => window.open(uploadResponse.downloadUrl, '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                Download File
              </Button>
              <Button
                onClick={() => window.open(uploadResponse.infoUrl, '_blank')}
                variant="outline"
                className="w-full"
              >
                <InformationCircleIcon className="w-4 h-4 mr-2" />
                View Info
              </Button>
              {uploadResponse.hasPassword && (
                <>
                  <Button
                    onClick={() => window.open(uploadResponse.editUrl, '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <DocumentIcon className="w-4 h-4 mr-2" />
                    Edit File
                  </Button>
                  <Button
                    onClick={() => window.open(uploadResponse.deleteUrl, '_blank')}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                    Delete File
                  </Button>
                </>
              )}
            </div>

            {/* Copy Links Section */}
            <div className="mt-4 pt-4 border-t border-border">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">Copy Links</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 text-xs">
                    {window.location.origin}{uploadResponse.downloadUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${uploadResponse.downloadUrl}`)
                      toast.success('Download link copied!')
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 text-xs">
                    {window.location.origin}{uploadResponse.infoUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${uploadResponse.infoUrl}`)
                      toast.success('Info link copied!')
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Copy
                  </Button>
                </div>
                {uploadResponse.hasPassword && (
                  <>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 text-xs">
                        {window.location.origin}{uploadResponse.editUrl}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}${uploadResponse.editUrl}`)
                          toast.success('Edit link copied!')
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 text-xs">
                        {window.location.origin}{uploadResponse.deleteUrl}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}${uploadResponse.deleteUrl}`)
                          toast.success('Delete link copied!')
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Copy
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Your file ID has been saved locally for easy access</li>
                  <li>• You can share the download link with anyone</li>
                  <li>• Use the file ID to access your file later</li>
                  {uploadResponse.hasPassword && (
                    <li>• Use your password to edit or delete this file</li>
                  )}
                  <li>• Visit the Files page to see all your uploads</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={startNewUpload}
            variant="outline"
            className="px-8 py-3"
          >
            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
            Upload Another File
          </Button>
          <Button
            onClick={() => window.location.href = '/files'}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <DocumentIcon className="w-4 h-4 mr-2" />
            View All Files
          </Button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      case 'compressing':
        return <ArchiveBoxIcon className="w-5 h-5 text-orange-500" />
      case 'uploading':
        return <CloudArrowUpIcon className="w-5 h-5 text-blue-500" />
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'compressing':
        return 'text-orange-600'
      case 'uploading':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ready to upload'
      case 'compressing':
        return 'Compressing...'
      case 'uploading':
        return 'Uploading...'
      case 'success':
        return 'Success'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Uploading...</h3>
                <p className="text-muted-foreground">Please wait while we process your files</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Upload Files
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share files securely with end-to-end encryption, customizable expiry times, and password protection.
            <br />
            <span className="text-sm text-blue-600 dark:text-blue-400">
              💡 Tip: File IDs are stored locally so you can access your files later without creating an account!
            </span>
          </p>
        </div>

        {/* Show success UI if upload was successful */}
        {uploadSuccess && uploadResponse ? (
          <UploadSuccessUI />
        ) : (
          <>
        {/* Upload Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600" />
              Upload Settings
            </CardTitle>
            <CardDescription>
              Configure how your files will be shared and protected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Protection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password Protection</Label>
                  <Switch
                    id="password-toggle"
                    checked={showPassword}
                    onCheckedChange={setShowPassword}
                        disabled={isUploading}
                  />
                </div>
                {showPassword && (
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password (6-12 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    maxLength={12}
                        disabled={isUploading}
                  />
                )}
              </div>

              {/* Expiry Time */}
              <div className="space-y-2">
                <Label htmlFor="expiresIn">Expires In</Label>
                    <Select 
                      value={expiresIn} 
                      onValueChange={(value: any) => setExpiresIn(value)}
                      disabled={isUploading}
                    >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiry time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Downloads */}
              <div className="space-y-2">
                <Label htmlFor="maxDownloads">Max Downloads</Label>
                <Input
                  id="maxDownloads"
                  type="number"
                  placeholder="Unlimited"
                  value={maxDownloads || ''}
                      onChange={(e) => setMaxDownloads(e.target.value ? parseInt(e.target.value) : 10)}
                  min={1}
                  max={1000}
                      disabled={isUploading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Drop Zone */}
        <Card>
          <CardContent className="p-8">
            <div
              {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    isUploading
                      ? 'border-gray-300 bg-gray-50 dark:bg-gray-950/20 cursor-not-allowed opacity-60'
                      : isDragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 cursor-pointer'
                      : 'border-border hover:border-blue-400 hover:bg-muted/50 cursor-pointer'
                  }`}
                >
                  <input {...getInputProps()} disabled={isUploading} />
                  <CloudArrowUpIcon className={`w-16 h-16 mx-auto mb-4 ${
                    isUploading ? 'text-gray-400' : 'text-muted-foreground'
                  }`} />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                    {isUploading 
                      ? 'Upload in progress...' 
                      : isDragActive 
                        ? 'Drop files here' 
                        : 'Drag & drop files here'
                    }
              </h3>
              <p className="text-muted-foreground mb-4">
                    {isUploading ? 'Please wait for upload to complete' : 'or click to select files'}
              </p>
              <p className="text-sm text-muted-foreground">
                    <span>Supports images, videos, documents, and more (max 100MB total)</span>
                    <br />
                    <span className="text-blue-600 dark:text-blue-400">
                      💡 Multiple files will be automatically compressed into a ZIP
                    </span>
                    {isUploading && (
                      <>
                        <br />
                        <span className="text-orange-600 dark:text-orange-400">
                          ⏳ Upload in progress - please wait
                        </span>
                      </>
                    )}
                    {!isUploading && (
                      <>
                        <br />
                        <span className="text-green-600 dark:text-green-400">
                          ✅ Ready to accept files
                        </span>
                      </>
                    )}
              </p>
            </div>
          </CardContent>
        </Card>

            {/* ZIP Filename Input (only show when multiple files) */}
            {uploadedFiles.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArchiveBoxIcon className="w-5 h-5 text-orange-600" />
                    ZIP File Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the name of your compressed ZIP file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="zipFileName">ZIP Filename</Label>
                    <Input
                      id="zipFileName"
                      type="text"
                      placeholder="compressed-files.zip"
                      value={zipFileName}
                      onChange={(e) => setZipFileName(e.target.value)}
                      className="font-mono"
                      disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be the name of your compressed ZIP file when uploaded
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                    <div className="flex flex-col">
                <span>Selected Files ({uploadedFiles.length})</span>
                      <div className="text-sm font-normal text-muted-foreground mt-1">
                        Total Size: {getTotalSizeMB().toFixed(2)} MB
                        <span className="text-blue-600 dark:text-blue-400 ml-2">
                          ({(100 - getTotalSizeMB()).toFixed(2)} MB remaining)
                        </span>
                      </div>
                    </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    disabled={isUploading}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={uploadFiles}
                    disabled={isUploading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''}`}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
                  {/* Size Warning */}
                  {(() => {
                    const totalSizeMB = getTotalSizeMB()
                    if (totalSizeMB > 90) {
                      return (
                        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Approaching 100MB limit!</span>
                          </div>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Current total: {totalSizeMB.toFixed(2)} MB. You can add {getRemainingMB().toFixed(2)} MB more.
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Duplicate File Warning */}
                  {(() => {
                    const checksums = uploadedFiles.map(uf => uf.checksum)
                    const duplicates = checksums.filter((checksum, index) => checksums.indexOf(checksum) !== index)
                    if (duplicates.length > 0) {
                      return (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <ExclamationCircleIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Duplicate files detected!</span>
                          </div>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Some files have identical content (same checksum). Consider removing duplicates to save space.
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}
                  
              <div className="space-y-4">
                {uploadedFiles.map((fileData, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(fileData.status)}
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{fileData.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                            <p className="text-xs text-gray-500 font-mono">
                              Checksum: {fileData.checksum.substring(0, 8)}...{fileData.checksum.substring(fileData.checksum.length - 8)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Progress Bar */}
                      {fileData.status === 'uploading' && (
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileData.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Status */}
                      <span className={`text-sm font-medium ${getStatusColor(fileData.status)}`}>
                            {getStatusText(fileData.status)}
                      </span>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Success Message */}
              {uploadedFiles.some(f => f.status === 'success') && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-medium">Files uploaded successfully!</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your file IDs have been stored locally. You can access them later from the Files page without creating an account.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
