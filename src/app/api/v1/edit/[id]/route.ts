import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateFileWithOwnership, logAccess, getFileWithPassword } from '@/lib/db'
import { validatePasswordStrength, hashPassword } from '@/lib/password'

const EditSchema = z.object({
  expiresAt: z.string().nullable().optional(),
  maxDownloads: z.number().min(1).max(10000).nullable().optional(),
  password: z.string().min(6).max(50).optional(), // New password if changing
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id
    const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Get request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON',
        message: 'The request body must be valid JSON',
      }, { status: 400 })
    }

    // Validate request body
    const validation = EditSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid edit parameters',
        details: validation.error.errors,
      }, { status: 400 })
    }

    const { expiresAt, maxDownloads, password: newPassword } = validation.data

    // Get current password from request headers
    const currentPassword = request.headers.get('x-file-password')

    // First, check if the file exists and get its current state
    const currentFile = await getFileWithPassword(fileId, currentPassword)
    
    if (!currentFile) {
      await logAccess(fileId, 'EDIT', ip, userAgent, false, 'File not found')
      return NextResponse.json({
        success: false,
        error: 'File not found',
        message: 'The requested file does not exist or has been removed',
      }, { status: 404 })
    }

    // Check if file is active
    if (currentFile.status !== 'ACTIVE') {
      await logAccess(fileId, 'EDIT', ip, userAgent, false, `File status: ${currentFile.status}`)
      return NextResponse.json({
        success: false,
        error: 'File not active',
        message: `This file is ${currentFile.status.toLowerCase()} and cannot be edited`,
      }, { status: 410 })
    }

    // Check if file requires password but none provided
    if (currentFile.requiresPassword) {
      await logAccess(fileId, 'EDIT', ip, userAgent, false, 'Password required')
      return NextResponse.json({
        success: false,
        error: 'Password required',
        message: 'This file is password protected. Please provide the password in the x-file-password header.',
        data: {
          fileId,
          requiresPassword: true,
          message: 'This file is password-protected. You need the password to edit it.',
        }
      }, { status: 401 })
    }

    // Check if password is invalid
    if (currentFile.passwordInvalid) {
      await logAccess(fileId, 'EDIT', ip, userAgent, false, 'Invalid password')
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        message: 'The provided password is incorrect for this file.',
        data: {
          fileId,
          passwordInvalid: true,
          message: 'Incorrect password. This file cannot be edited.',
        }
      }, { status: 401 })
    }

    // If file has no password protection, it cannot be modified
    if (!currentFile.passwordHash) {
      await logAccess(fileId, 'EDIT', ip, userAgent, false, 'No password protection')
      return NextResponse.json({
        success: false,
        error: 'No password protection',
        message: 'This file has no password protection and cannot be modified.',
        data: {
          fileId,
          message: 'Files without password protection cannot be edited or deleted. Only the original uploader can access them.',
        }
      }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') {
        updateData.expiresAt = null
      } else {
        updateData.expiresAt = new Date(expiresAt)
      }
    }

    if (maxDownloads !== undefined) {
      if (maxDownloads === null || maxDownloads === 0) {
        updateData.maxDownloads = null
      } else {
        updateData.maxDownloads = maxDownloads
      }
    }

    // Handle password change if provided
    if (newPassword) {
      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        return NextResponse.json({
          success: false,
          error: 'Invalid password',
          message: 'New password does not meet requirements',
          details: passwordValidation.errors,
        }, { status: 400 })
      }

      // Hash the new password
      updateData.passwordHash = await hashPassword(newPassword)
    }

    // Check if there are any updates
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No updates provided',
        message: 'Please provide at least one field to update',
      }, { status: 400 })
    }

    try {
      // Update file with ownership validation
      const updatedFile = await updateFileWithOwnership(fileId, updateData, currentPassword)

      // Log successful edit
      await logAccess(fileId, 'EDIT', ip, userAgent, true)

      return NextResponse.json({
        success: true,
        message: 'File updated successfully',
        data: {
          fileId: updatedFile.id,
          originalName: updatedFile.originalName,
          expiresAt: updatedFile.expiresAt,
          maxDownloads: updatedFile.maxDownloads,
          updatedAt: updatedFile.updatedAt,
          message: 'File has been updated successfully.',
        }
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      
      // Log failed edit attempt
      await logAccess(fileId, 'EDIT', ip, userAgent, false, errorMessage)

      return NextResponse.json({
        success: false,
        error: 'Update failed',
        message: errorMessage,
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Edit API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while updating the file',
    }, { status: 500 })
  }
}

/**
 * Handle PATCH requests (same as PUT)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return PUT(request, { params })
}
