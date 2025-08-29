// File storage and metadata management with privacy-first approach
import bcrypt from 'bcryptjs'

export interface FileMetadata {
  id: string
  name: string
  type: string
  size: number
  visibility: 'public' | 'private'
  passwordHash: string
  createdAt: string
  expiresAt?: string
  maxDownloads?: number
  downloadCount: number
  lastAccessed?: string
  checksum: string
}

export interface FileUploadRequest {
  file: File
  password: string
  visibility: 'public' | 'private'
  expiresIn?: '1h' | '1d' | '7d' | '30d' | '1y' | 'never'
  maxDownloads?: number
}

export interface FileAccessRequest {
  fileId: string
  password: string
  action: 'download' | 'info' | 'edit' | 'delete'
}

// Public utility functions
export function generateFileId(): string {
  // Generate a unique 20-40 character ID (numbers + lowercase)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const length = Math.floor(Math.random() * 21) + 20 // 20-40 chars
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function calculateExpiryDate(expiresIn: string): Date | null {
  if (expiresIn === 'never') return null
  
  const now = new Date()
  let milliseconds: number
  
  switch (expiresIn) {
    case '1h':
      milliseconds = 60 * 60 * 1000 // 1 hour
      break
    case '1d':
      milliseconds = 24 * 60 * 60 * 1000 // 1 day
      break
    case '7d':
      milliseconds = 7 * 24 * 60 * 60 * 1000 // 7 days
      break
    case '30d':
      milliseconds = 30 * 24 * 60 * 60 * 1000 // 30 days
      break
    case '1y':
      milliseconds = 365 * 24 * 60 * 60 * 1000 // 1 year
      break
    default:
      milliseconds = 0
  }
  
  return new Date(now.getTime() + milliseconds)
}

// File metadata storage (in production, this would be in a database)
class FileMetadataStore {
  private static instance: FileMetadataStore
  private files: Map<string, FileMetadata> = new Map()
  private readonly STORAGE_KEY = 'droply_files_metadata'

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): FileMetadataStore {
    if (!FileMetadataStore.instance) {
      FileMetadataStore.instance = new FileMetadataStore()
    }
    return FileMetadataStore.instance
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.files = new Map(Object.entries(parsed))
      }
    } catch (error) {
      console.error('Failed to load file metadata:', error)
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return
    
    try {
      const obj = Object.fromEntries(this.files)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj))
    } catch (error) {
      console.error('Failed to save file metadata:', error)
    }
  }

  async addFile(metadata: Omit<FileMetadata, 'id' | 'createdAt' | 'downloadCount'>): Promise<FileMetadata> {
    const id = this.generateFileId()
    const now = new Date().toISOString()
    
    const fileMetadata: FileMetadata = {
      ...metadata,
      id,
      createdAt: now,
      downloadCount: 0
    }

    this.files.set(id, fileMetadata)
    this.saveToStorage()
    
    return fileMetadata
  }

  getFile(id: string): FileMetadata | undefined {
    return this.files.get(id)
  }

  async verifyPassword(fileId: string, password: string): Promise<boolean> {
    const file = this.files.get(fileId)
    if (!file) return false

    try {
      return await verify(password, file.passwordHash)
    } catch {
      return false
    }
  }

  async updateFile(id: string, updates: Partial<FileMetadata>): Promise<FileMetadata | null> {
    const file = this.files.get(id)
    if (!file) return null

    const updated = { ...file, ...updates }
    this.files.set(id, updated)
    this.saveToStorage()
    
    return updated
  }

  deleteFile(id: string): boolean {
    const deleted = this.files.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  getAllFiles(): FileMetadata[] {
    return Array.from(this.files.values())
  }

  private generateFileId(): string {
    // Generate a unique 20-40 character ID (numbers + lowercase)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const length = Math.floor(Math.random() * 21) + 20 // 20-40 chars
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}

// Password management utilities
export class PasswordManager {
  static async hashPassword(password: string): Promise<string> {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    if (password.length > 12) {
      throw new Error('Password must be at most 12 characters')
    }
    if (password.length === 0) {
      throw new Error('Password is required')
    }
    
    // Use bcrypt with salt rounds of 10 (good balance of security vs performance)
    return await bcrypt.hash(password, 10)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash)
    } catch {
      return false
    }
  }
}

// File access control
export class FileAccessControl {
  static canAccessFile(file: FileMetadata, action: 'download' | 'info' | 'edit' | 'delete', hasValidPassword: boolean): boolean {
    // Edit and delete always require password
    if (action === 'edit' || action === 'delete') {
      return hasValidPassword
    }

    // For public files, download and info are allowed without password
    if (file.visibility === 'public') {
      return true
    }

    // For private files, all actions require password
    return hasValidPassword
  }

  static isFileExpired(file: FileMetadata): boolean {
    if (!file.expiresAt || file.expiresAt === 'never') return false
    
    const expiryDate = new Date(file.expiresAt)
    return new Date() > expiryDate
  }

  static canDownload(file: FileMetadata): boolean {
    if (this.isFileExpired(file)) return false
    if (file.maxDownloads && file.downloadCount >= file.maxDownloads) return false
    return true
  }
}

// Session management for file access
export class FileSessionManager {
  private static readonly SESSION_PREFIX = 'file_session_'
  private static readonly SESSION_DURATION = 30 * 60 * 1000 // 30 minutes

  static createSession(fileId: string, password: string): string {
    const sessionId = `${this.SESSION_PREFIX}${fileId}_${Date.now()}`
    const sessionData = {
      fileId,
      password,
      createdAt: Date.now()
    }
    
    localStorage.setItem(sessionId, JSON.stringify(sessionData))
    return sessionId
  }

  static getValidSession(fileId: string): string | null {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter(key => key.startsWith(this.SESSION_PREFIX + fileId))
    
    for (const key of sessionKeys) {
      try {
        const sessionData = JSON.parse(localStorage.getItem(key) || '{}')
        const isExpired = Date.now() - sessionData.createdAt > this.SESSION_DURATION
        
        if (!isExpired && sessionData.fileId === fileId) {
          return key
        } else if (isExpired) {
          localStorage.removeItem(key)
        }
      } catch {
        localStorage.removeItem(key)
      }
    }
    
    return null
  }

  static clearSession(sessionId: string): void {
    localStorage.removeItem(sessionId)
  }

  static clearAllSessions(): void {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter(key => key.startsWith(this.SESSION_PREFIX))
    sessionKeys.forEach(key => localStorage.removeItem(key))
  }
}

// Export the singleton instance
export const fileStore = FileMetadataStore.getInstance()

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️'
  if (type.startsWith('video/')) return '🎥'
  if (type.startsWith('audio/')) return '🎵'
  if (type.includes('pdf')) return '📄'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
  if (type.includes('presentation') || type.includes('powerpoint')) return '📊'
  if (type.includes('zip') || type.includes('archive')) return '📦'
  if (type.includes('text/')) return '��'
  return '📎'
}
