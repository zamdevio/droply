import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isDemoMode } from '@/lib/env'

// Zod schemas for input validation
const BulkFileIdsSchema = z.object({
  action: z.enum(['delete', 'info', 'download']),
  fileIds: z.array(z.string().min(1)).min(1).max(100), // Max 100 files per request
  password: z.string().optional(), // Optional for info, required for delete/download
})

const BulkDeleteSchema = z.object({
  action: z.literal('delete'),
  fileIds: z.array(z.string().min(1)).min(1).max(100),
  password: z.string().min(6).max(12),
})

const BulkInfoSchema = z.object({
  action: z.literal('info'),
  fileIds: z.array(z.string().min(1)).min(1).max(100),
})

const BulkDownloadSchema = z.object({
  action: z.literal('download'),
  fileIds: z.array(z.string().min(1)).min(1).max(100),
  password: z.string().min(6).max(12),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the basic structure first
    const basicValidation = BulkFileIdsSchema.safeParse(body)
    if (!basicValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: basicValidation.error.errors,
      }, { status: 400 })
    }

    const { action, fileIds } = basicValidation.data

    // Validate action-specific requirements
    let validatedData: any
    switch (action) {
      case 'delete':
        validatedData = BulkDeleteSchema.safeParse(body)
        break
      case 'info':
        validatedData = BulkInfoSchema.safeParse(body)
        break
      case 'download':
        validatedData = BulkDownloadSchema.safeParse(body)
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: 'Action must be one of: delete, info, download',
        }, { status: 400 })
    }

    if (!validatedData.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validatedData.error.errors,
      }, { status: 400 })
    }

    const { password } = validatedData.data

    // Demo mode handling
    if (isDemoMode) {
      return handleDemoMode(action, fileIds, password)
    }

    // Real database operations
    switch (action) {
      case 'delete':
        return await handleBulkDelete(fileIds, password!)
      case 'info':
        return await handleBulkInfo(fileIds)
      case 'download':
        return await handleBulkDownload(fileIds, password!)
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Bulk file operation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
    }, { status: 500 })
  }
}

// Handle bulk delete operation
async function handleBulkDelete(fileIds: string[], password: string) {
  const results = []
  let successCount = 0
  let errorCount = 0

  for (const fileId of fileIds) {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId, status: { not: 'DELETED' } }
      })

      if (!file) {
        results.push({
          fileId,
          success: false,
          error: 'File not found or already deleted'
        })
        errorCount++
        continue
      }

      // Verify password if file has one
      if (file.password && file.password !== password) {
        results.push({
          fileId,
          success: false,
          error: 'Invalid password'
        })
        errorCount++
        continue
      }

      // Soft delete the file
      await prisma.file.update({
        where: { id: fileId },
        data: { status: 'DELETED' }
      })

      // Log the deletion
      await prisma.accessLog.create({
        data: {
          fileId,
          event: 'DELETE',
          ipAddress: '127.0.0.1', // You can extract real IP from request
          userAgent: 'Bulk API',
          ok: true
        }
      })

      results.push({
        fileId,
        success: true,
        message: 'File deleted successfully'
      })
      successCount++

    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error)
      results.push({
        fileId,
        success: false,
        error: 'Database error'
      })
      errorCount++
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk delete operation completed`,
    summary: {
      total: fileIds.length,
      successful: successCount,
      failed: errorCount,
      retrieved: successCount,
      missing: errorCount
    },
    results
  })
}

// Handle bulk info operation
async function handleBulkInfo(fileIds: string[]) {
  const results = []
  let successCount = 0
  let errorCount = 0

  for (const fileId of fileIds) {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId, status: { not: 'DELETED' } }
      })

      if (!file) {
        results.push({
          fileId,
          success: false,
          error: 'File not found or deleted'
        })
        errorCount++
        continue
      }

      // Get download count
      const downloadCount = await prisma.accessLog.count({
        where: { fileId, event: 'DOWNLOAD', ok: true }
      })

      // Check if file is expired
      const isExpired = file.expiresAt && new Date() > file.expiresAt

      results.push({
        fileId,
        success: true,
        data: {
          id: file.id,
          originalName: file.originalName,
          size: file.size,
          contentType: file.contentType,
          uploadDate: file.uploadDate,
          expiresAt: file.expiresAt,
          maxDownloads: file.maxDownloads,
          downloadCount,
          isExpired,
          hasPassword: !!file.password
        }
      })
      successCount++

    } catch (error) {
      console.error(`Error getting info for file ${fileId}:`, error)
      results.push({
        fileId,
        success: false,
        error: 'Database error'
      })
      errorCount++
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk info operation completed`,
    summary: {
      total: fileIds.length,
      successful: successCount,
      failed: errorCount,
      retrieved: successCount,
      missing: errorCount
    },
    results
  })
}

// Handle bulk download operation (returns download URLs, not actual files)
async function handleBulkDownload(fileIds: string[], password: string) {
  const results = []
  let successCount = 0
  let errorCount = 0

  for (const fileId of fileIds) {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId, status: { not: 'DELETED' } }
      })

      if (!file) {
        results.push({
          fileId,
          success: false,
          error: 'File not found or deleted'
        })
        errorCount++
        continue
      }

      // Verify password if file has one
      if (file.password && file.password !== password) {
        results.push({
          fileId,
          success: false,
          error: 'Invalid password'
        })
        errorCount++
        continue
      }

      // Check if file is expired
      if (file.expiresAt && new Date() > file.expiresAt) {
        results.push({
          fileId,
          success: false,
          error: 'File has expired'
        })
        errorCount++
        continue
      }

      // Check download limit
      const downloadCount = await prisma.accessLog.count({
        where: { fileId, event: 'DOWNLOAD', ok: true }
      })

      if (file.maxDownloads && downloadCount >= file.maxDownloads) {
        results.push({
          fileId,
          success: false,
          error: 'Download limit reached'
        })
        errorCount++
        continue
      }

      results.push({
        fileId,
        success: true,
        data: {
          downloadUrl: `/api/v1/download/${fileId}`,
          originalName: file.originalName,
          size: file.size,
          contentType: file.contentType
        }
      })
      successCount++

    } catch (error) {
      console.error(`Error processing download for file ${fileId}:`, error)
      results.push({
        fileId,
        success: false,
        error: 'Database error'
      })
      errorCount++
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk download operation completed`,
    summary: {
      total: fileIds.length,
      successful: successCount,
      failed: errorCount,
      retrieved: successCount,
      missing: errorCount
    },
    results
  })
}

// Demo mode handling
function handleDemoMode(action: string, fileIds: string[], password?: string) {
  const demoFiles = [
    {
      id: 'demo1',
      originalName: 'presentation.pdf',
      size: 1024000,
      contentType: 'application/pdf',
      uploadDate: new Date('2024-01-15'),
      expiresAt: new Date('2024-02-15'),
      maxDownloads: 50,
      hasPassword: true
    },
    {
      id: 'demo2',
      originalName: 'image.jpg',
      size: 512000,
      contentType: 'image/jpeg',
      uploadDate: new Date('2024-01-14'),
      expiresAt: new Date('2024-01-21'),
      maxDownloads: 20,
      hasPassword: false
    }
  ]

  const results = fileIds.map(fileId => {
    const demoFile = demoFiles.find(f => f.id === fileId)
    
    if (!demoFile) {
      return {
        fileId,
        success: false,
        error: 'File not found'
      }
    }

    // Simulate password validation for delete/download
    if (action !== 'info' && demoFile.hasPassword && password !== 'demo123') {
      return {
        fileId,
        success: false,
        error: 'Invalid password'
      }
    }

    switch (action) {
      case 'delete':
        return {
          fileId,
          success: true,
          message: 'File deleted successfully (demo)'
        }
      case 'info':
        return {
          fileId,
          success: true,
          data: {
            ...demoFile,
            downloadCount: Math.floor(Math.random() * 10),
            isExpired: new Date() > demoFile.expiresAt
          }
        }
      case 'download':
        return {
          fileId,
          success: true,
          data: {
            downloadUrl: `/api/v1/download/${fileId}`,
            originalName: demoFile.originalName,
            size: demoFile.size,
            contentType: demoFile.contentType
          }
        }
      default:
        return {
          fileId,
          success: false,
          error: 'Invalid action'
        }
    }
  })

  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length

  return NextResponse.json({
    success: true,
    message: `Demo bulk ${action} operation completed`,
    summary: {
      total: fileIds.length,
      successful: successCount,
      failed: errorCount,
      retrieved: successCount,
      missing: errorCount
    },
    results
  })
}
