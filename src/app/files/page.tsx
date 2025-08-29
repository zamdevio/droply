'use client'

import { useState, useEffect } from 'react'
import { 
  DocumentIcon, 
  EyeIcon, 
  TrashIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { localFileStorage, LocalFileInfo, formatFileSize, getFileIcon, isFileExpired, getTimeUntilExpiry } from '@/lib/localFileStorage'
import { toast } from 'sonner'

interface FileWithInfo extends LocalFileInfo {
  status: 'active' | 'expired' | 'deleted'
  downloadCount?: number
  isExpired: boolean
}

export default function FilesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [files, setFiles] = useState<FileWithInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = () => {
    const localFiles = localFileStorage.getAllFiles()
    const filesWithInfo: FileWithInfo[] = localFiles.map(file => ({
      ...file,
      status: file.expiresAt && new Date() > new Date(file.expiresAt) ? 'expired' : 'active',
      isExpired: file.expiresAt ? new Date() > new Date(file.expiresAt) : false,
      downloadCount: 0 // This would come from the API in a real implementation
    }))
    setFiles(filesWithInfo)
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.contentType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || file.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleBulkOperation = async (action: 'info' | 'delete' | 'download') => {
    if (selectedFiles.size === 0) {
      toast.error('Please select files first')
      return
    }

    setIsLoading(true)
    const fileIds = Array.from(selectedFiles)

    try {
      const response = await fetch('/api/v1/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          fileIds,
          password: 'demo123', // In real app, this would come from user input
        }),
      })

      const result = await response.json()

      if (result.success) {
        const { summary } = result
        
        if (action === 'delete') {
          // Remove deleted files from local storage
          fileIds.forEach(fileId => {
            localFileStorage.removeFile(fileId)
          })
          
          toast.success(`Bulk delete completed`, {
            description: `Successfully deleted ${summary.successful} files, ${summary.failed} failed`
          })
          
          // Clear selection and reload files
          setSelectedFiles(new Set())
          loadFiles()
        } else if (action === 'info') {
          toast.success(`File information retrieved`, {
            description: `Retrieved ${summary.retrieved} files, ${summary.missing} missing`
          })
          
          // You could show a modal with detailed info here
          console.log('File info results:', result.results)
        } else if (action === 'download') {
          toast.success(`Download URLs generated`, {
            description: `Generated ${summary.successful} download URLs, ${summary.failed} failed`
          })
          
          // You could show download links or trigger downloads here
          console.log('Download results:', result.results)
        }
      } else {
        throw new Error(result.error || 'Operation failed')
      }
    } catch (error) {
      console.error(`${action} operation error:`, error)
      toast.error(`${action} operation failed`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId)
    } else {
      newSelection.add(fileId)
    }
    setSelectedFiles(newSelection)
  }

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.fileId)))
    }
  }

  const removeFile = (fileId: string) => {
    localFileStorage.removeFile(fileId)
    loadFiles()
    toast.success('File removed from local storage')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground">My Files</h1>
        <p className="text-muted-foreground mt-2">
          Files stored locally from your uploads. No account required!
        </p>
      </div>

      {/* Bulk Actions */}
      {selectedFiles.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation('info')}
                disabled={isLoading}
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Get Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation('download')}
                disabled={isLoading}
              >
                <CloudArrowDownIcon className="w-4 h-4 mr-2" />
                Get URLs
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkOperation('delete')}
                disabled={isLoading}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <FunnelIcon className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Files</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                    onChange={selectAllFiles}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFiles.map((file) => (
                <tr key={file.fileId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.fileId)}
                      onChange={() => toggleFileSelection(file.fileId)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{getFileIcon(file.contentType)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {file.originalName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {file.contentType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {file.expiresAt ? (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {file.isExpired ? 'Expired' : getTimeUntilExpiry(file.expiresAt)}
                      </div>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(file.status)}`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0 hover:bg-muted"
                        title="View Info"
                      >
                        <a href={`/info/${file.fileId}`} target="_blank" rel="noopener noreferrer">
                          <EyeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0 hover:bg-muted"
                        title="Download"
                      >
                        <a href={`/download/${file.fileId}`} target="_blank" rel="noopener noreferrer">
                          <ArrowDownTrayIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0 hover:bg-muted"
                        title="Delete File"
                      >
                        <a href={`/delete/file:${file.fileId}`} target="_blank" rel="noopener noreferrer">
                          <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <DocumentIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm || filterStatus !== 'all' 
              ? 'No files found'
              : 'No files uploaded yet'
            }
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Upload your first file to get started. File IDs will be stored locally for easy access!'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <a href="/upload">
                <DocumentIcon className="w-4 h-4 mr-2" />
                Upload Files
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Storage Stats */}
      {files.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Storage Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{files.length}</div>
              <div className="text-sm text-muted-foreground">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {files.filter(f => f.hasPassword).length}
              </div>
              <div className="text-sm text-muted-foreground">Protected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {files.filter(f => f.isExpired).length}
              </div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      case 'expired':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }
}
