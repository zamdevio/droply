import { NextRequest, NextResponse } from 'next/server'
import { getFileWithPassword, logAccess } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id
    const password = request.headers.get('x-file-password') || request.nextUrl.searchParams.get('password') || undefined
    const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Get file with password verification
    const file = await getFileWithPassword(fileId, password)

    if (!file) {
      await logAccess(fileId, 'INFO', ip, userAgent, false, 'File not found')
      return NextResponse.json({
        success: false,
        error: 'File not found',
        message: 'The requested file does not exist or has been removed',
      }, { status: 404 })
    }

    // Check if file is expired
    if (file.status === 'EXPIRED') {
      await logAccess(fileId, 'INFO', ip, userAgent, false, 'File expired')
      return NextResponse.json({
        success: false,
        error: 'File expired',
        message: 'This file has expired and is no longer available',
        data: {
          fileId,
          status: 'EXPIRED',
          expiredAt: file.expiresAt,
        }
      }, { status: 410 })
    }

    // Check if file is deleted or blocked
    if (file.status !== 'ACTIVE') {
      await logAccess(fileId, 'INFO', ip, userAgent, false, `File status: ${file.status}`)
      return NextResponse.json({
        success: false,
        error: 'File unavailable',
        message: `This file is ${file.status.toLowerCase()} and cannot be accessed`,
        data: {
          fileId,
          status: file.status,
        }
      }, { status: 410 })
    }

    // Check if file requires password but none provided
    if (file.requiresPassword) {
      await logAccess(fileId, 'INFO', ip, userAgent, false, 'Password required')
      return NextResponse.json({
        success: false,
        error: 'Password required',
        message: 'This file is password-protected. Please provide the password to access it.',
        data: {
          fileId,
          requiresPassword: true,
          message: 'This file has password protection. You need the password to view, edit, or delete it.',
        }
      }, { status: 401 })
    }

    // Check if password is invalid
    if (file.passwordInvalid) {
      await logAccess(fileId, 'INFO', ip, userAgent, false, 'Invalid password')
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        message: 'The provided password is incorrect for this file.',
        data: {
          fileId,
          passwordInvalid: true,
          message: 'Incorrect password. This file cannot be accessed, edited, or deleted.',
        }
      }, { status: 401 })
    }

    // Check download limits
    if (file.maxDownloads && file.downloads >= file.maxDownloads) {
      await logAccess(fileId, 'INFO', ip, userAgent, false, 'Download limit reached')
      return NextResponse.json({
        success: false,
        error: 'Download limit reached',
        message: 'This file has reached its maximum download limit.',
        data: {
          fileId,
          downloads: file.downloads,
          maxDownloads: file.maxDownloads,
        }
      }, { status: 429 })
    }

    // Log successful access
    await logAccess(fileId, 'INFO', ip, userAgent, true)

    // Return file information
    return NextResponse.json({
      success: true,
      message: 'File information retrieved successfully',
      data: {
        fileId: file.id,
        originalName: file.originalName,
        contentType: file.contentType,
        size: Number(file.sizeBytes),
        sizeFormatted: formatFileSize(Number(file.sizeBytes)),
        downloads: file.downloads,
        maxDownloads: file.maxDownloads,
        isPublic: file.isPublic,
        expiresAt: file.expiresAt,
        lastAccessAt: file.lastAccessAt,
        createdAt: file.createdAt,
        meta: file.meta,
        hasPassword: !!file.passwordHash,
        canEdit: !!file.passwordHash, // Only password-protected files can be edited
        canDelete: !!file.passwordHash, // Only password-protected files can be deleted
        ownershipInfo: file.passwordHash 
          ? 'This file is password-protected and can be edited/deleted by providing the correct password'
          : 'This file has no password protection and cannot be modified. Only the original uploader can access it.',
        urls: {
          download: `/api/v1/download/${fileId}`,
          edit: `/api/v1/edit/${fileId}`,
          delete: `/api/v1/delete/${fileId}`,
        },
        // Additional metadata for ZIP files
        isZipFile: !!file.meta && Array.isArray(file.meta),
        fileCount: file.meta && Array.isArray(file.meta) ? file.meta.length : 1,
        compressionInfo: file.meta && Array.isArray(file.meta) 
          ? `Contains ${file.meta.length} compressed files`
          : 'Single file',
      }
    })

  } catch (error) {
    console.error('Info API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while retrieving file information',
    }, { status: 500 })
  }
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
