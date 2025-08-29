// Local file storage for anonymous users
// This allows users to access their uploaded files without creating accounts

export interface LocalFileInfo {
  fileId: string
  originalName: string
  size: number
  contentType: string
  uploadDate: string
  expiresAt?: string
  maxDownloads?: number
  hasPassword: boolean
  expiryInfo: string
}

export interface LocalFileStorage {
  addFile(fileInfo: LocalFileInfo): void
  getFile(fileId: string): LocalFileInfo | null
  getAllFiles(): LocalFileInfo[]
  removeFile(fileId: string): boolean
  clearAllFiles(): void
  getFileCount(): number
}

class LocalFileStorageManager implements LocalFileStorage {
  private readonly STORAGE_KEY = 'droply_local_files'
  private readonly MAX_FILES = 1000 // Prevent unlimited storage

  constructor() {
    // Clean up expired files on initialization
    this.cleanupExpiredFiles()
  }

  addFile(fileInfo: LocalFileInfo): void {
    try {
      const files = this.getAllFiles()
      
      // Check if file already exists
      const existingIndex = files.findIndex(f => f.fileId === fileInfo.fileId)
      if (existingIndex !== -1) {
        // Update existing file
        files[existingIndex] = fileInfo
      } else {
        // Add new file
        if (files.length >= this.MAX_FILES) {
          // Remove oldest file to make space
          files.shift()
        }
        files.push(fileInfo)
      }

      // Sort by upload date (newest first)
      files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      
      this.saveToStorage(files)
    } catch (error) {
      console.error('Failed to add file to local storage:', error)
    }
  }

  getFile(fileId: string): LocalFileInfo | null {
    try {
      const files = this.getAllFiles()
      const file = files.find(f => f.fileId === fileId)
      
      if (!file) return null

      // Check if file is expired
      if (file.expiresAt && new Date() > new Date(file.expiresAt)) {
        // Remove expired file
        this.removeFile(fileId)
        return null
      }

      return file
    } catch (error) {
      console.error('Failed to get file from local storage:', error)
      return null
    }
  }

  getAllFiles(): LocalFileInfo[] {
    try {
      if (typeof window === 'undefined') return []
      
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const files: LocalFileInfo[] = JSON.parse(stored)
      
      // Filter out expired files
      const validFiles = files.filter(file => {
        if (!file.expiresAt) return true
        return new Date() <= new Date(file.expiresAt)
      })

      // Update storage if some files were expired
      if (validFiles.length !== files.length) {
        this.saveToStorage(validFiles)
      }

      return validFiles
    } catch (error) {
      console.error('Failed to get files from local storage:', error)
      return []
    }
  }

  removeFile(fileId: string): boolean {
    try {
      const files = this.getAllFiles()
      const initialLength = files.length
      const filteredFiles = files.filter(f => f.fileId !== fileId)
      
      if (filteredFiles.length !== initialLength) {
        this.saveToStorage(filteredFiles)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to remove file from local storage:', error)
      return false
    }
  }

  clearAllFiles(): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear local storage:', error)
    }
  }

  getFileCount(): number {
    return this.getAllFiles().length
  }

  private saveToStorage(files: LocalFileInfo[]): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
      console.error('Failed to save to local storage:', error)
    }
  }

  private cleanupExpiredFiles(): void {
    try {
      const files = this.getAllFiles()
      const validFiles = files.filter(file => {
        if (!file.expiresAt) return true
        return new Date() <= new Date(file.expiresAt)
      })

      if (validFiles.length !== files.length) {
        this.saveToStorage(validFiles)
        console.log(`Cleaned up ${files.length - validFiles.length} expired files`)
      }
    } catch (error) {
      console.error('Failed to cleanup expired files:', error)
    }
  }

  // Utility methods
  getFilesByType(contentType: string): LocalFileInfo[] {
    return this.getAllFiles().filter(file => 
      file.contentType.startsWith(contentType)
    )
  }

  getFilesBySize(minSize: number, maxSize: number): LocalFileInfo[] {
    return this.getAllFiles().filter(file => 
      file.size >= minSize && file.size <= maxSize
    )
  }

  searchFiles(query: string): LocalFileInfo[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllFiles().filter(file =>
      file.originalName.toLowerCase().includes(lowerQuery) ||
      file.contentType.toLowerCase().includes(lowerQuery)
    )
  }

  getStorageStats(): {
    totalFiles: number
    totalSize: number
    fileTypes: Record<string, number>
    passwordProtected: number
    expired: number
  } {
    const files = this.getAllFiles()
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    
    const fileTypes: Record<string, number> = {}
    let passwordProtected = 0
    let expired = 0

    files.forEach(file => {
      // Count file types
      const type = file.contentType.split('/')[0] || 'unknown'
      fileTypes[type] = (fileTypes[type] || 0) + 1

      // Count password protected files
      if (file.hasPassword) passwordProtected++

      // Count expired files
      if (file.expiresAt && new Date() > new Date(file.expiresAt)) {
        expired++
      }
    })

    return {
      totalFiles: files.length,
      totalSize,
      fileTypes,
      passwordProtected,
      expired
    }
  }
}

// Export singleton instance
export const localFileStorage = new LocalFileStorageManager()

// Export the class for testing
export { LocalFileStorageManager }

// Utility functions for working with local storage
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return '🖼️'
  if (contentType.startsWith('video/')) return '🎥'
  if (contentType.startsWith('audio/')) return '🎵'
  if (contentType.includes('pdf')) return '📄'
  if (contentType.includes('word') || contentType.includes('document')) return '📝'
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊'
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📊'
  if (contentType.includes('zip') || contentType.includes('archive')) return '📦'
  if (contentType.startsWith('text/')) return '📄'
  return '📎'
}

export function isFileExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false
  return new Date() > new Date(expiresAt)
}

export function getTimeUntilExpiry(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
