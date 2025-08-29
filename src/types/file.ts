export interface FileInfo {
  id: string
  name: string
  type: string
  size: number
  visibility: 'public' | 'private'
  createdAt: string
  expiresAt?: string
  maxDownloads?: number
  downloadCount: number
  checksum: string
  bucket?: string
  key?: string
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
