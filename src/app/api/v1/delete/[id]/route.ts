import { NextRequest, NextResponse } from 'next/server'
import { deleteFileWithOwnership, logAccess, getFileWithPassword } from '@/lib/db'
import { FileStatus } from '@prisma/client'
import { userAgent } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id
    const ip = request.headers.get('x-forwarded-for') || 'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Get password from request headers
    const password = request.headers.get('x-file-password') || undefined

    // First, check if the file exists and get its current state
    const currentFile = await getFileWithPassword(fileId, password)
    
    if (!currentFile) {
      await logAccess(fileId, 'DELETE', ip, userAgent, false, 'File not found')
      return NextResponse.json({
        success: false,
        error: 'File not found',
        message: 'The requested file does not exist or has been removed',
      }, { status: 404 })
    }

    // Check if file is active
    if (currentFile.status !== FileStatus.ACTIVE) {
      await logAccess(fileId, 'DELETE', ip, userAgent, false, `File status: ${currentFile.status}`)
      return NextResponse.json({
        success: false,
        error: 'File not active',
        message: `This file is ${currentFile.status.toLowerCase()} and cannot be deleted`,
      }, { status: 410 })
    }

    // Check if file requires password but none provided
    if (currentFile.passwordHash) {
      await logAccess(fileId, 'DELETE', ip, userAgent, userAgent, 'Password required')
      return NextResponse.json({
        success: false,
        error: 'Password required',
        message: 'This file is password protected. Please provide the password in the x-file-password header.',
        data: {
          fileId,
          requiresPassword: true,
          message: 'This file is password-protected. You need the password to delete it.',
        }
      }, { status: 401 })
    }

    // Check if password is invalid
    if (currentFile.passwordInvalid) {
      await logAccess(fileId, 'DELETE', ip, userAgent, false, 'Invalid password')
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        message: 'The provided password is incorrect for this file.',
        data: {
          fileId,
          passwordInvalid: true,
          message: 'Incorrect password. This file cannot be deleted.',
        }
      }, { status: 401 })
    }

    // If file has no password protection, it cannot be deleted
    if (!currentFile.passwordHash) {
      await logAccess(fileId, 'DELETE', ip, userAgent, false, 'No password protection')
      return NextResponse.json({
        success: false,
        error: 'No password protection',
        message: 'This file has no password protection and cannot be deleted.',
        data: {
          fileId,
          message: 'Files without password protection cannot be edited or deleted. Only the original uploader can access them.',
        }
      }, { status: 403 })
    }

    try {
      // Delete file with ownership validation
      const deletedFile = await deleteFileWithOwnership(fileId, password)

      // Log successful deletion
      await logAccess(fileId, 'DELETE', ip, userAgent, true)

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
        data: {
          fileId: deletedFile.id,
          originalName: deletedFile.originalName,
          deletedAt: deletedFile.deletedAt,
          status: deletedFile.status,
          message: 'File has been deleted successfully.',
        }
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Deletion failed'
      
      // Log failed deletion attempt
      await logAccess(fileId, 'DELETE', ip, userAgent, false, errorMessage)

      return NextResponse.json({
        success: false,
        error: 'Deletion failed',
        message: errorMessage,
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while deleting the file',
    }, { status: 500 })
  }
}

/**
 * Handle POST requests (same as DELETE)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return DELETE(request, { params })
}
