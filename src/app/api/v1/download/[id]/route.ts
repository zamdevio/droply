import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { decompressFile, type CompressionMetadata } from '@/lib/utils/compression'

const downloadSchema = z.object({
  id: z.string().min(20, 'Invalid file ID').max(40, 'Invalid file ID'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(12, 'Password must be at most 12 characters'),
  // 🔥 NEW: Decompression options
  decompress: z.enum(['client', 'server', 'raw']).default('client'),
  extractSingle: z.string().optional(), // Extract specific file from archive
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
  
    // Validate request body
    const validationResult = downloadSchema.safeParse({
      id: params.id,
      password: body.password
    })
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { id, password, decompress, extractSingle } = validationResult.data

    // Get file from database
    const file = await prisma.file.findUnique({
      where: { id }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 400 }
      )
    }

    // Check if file is deleted
    if (file.status === 'DELETED') {
      return NextResponse.json(
        { error: 'File has been deleted' },
        { status: 410 }
      )
    }

    // Check if file is expired
    if (file.expiresAt && new Date() > file.expiresAt) {
      return NextResponse.json(
        { error: 'File has expired' },
        { status: 410 }
      )
    }

    // Check download limits
    if (file.maxDownloads && file.downloads >= file.maxDownloads) {
      return NextResponse.json(
        { error: 'Download limit reached' },
        { status: 429 }
      )
    }

    // Verify password
    if (!file.passwordHash) {
      return NextResponse.json(
        { error: 'File has no password protection' },
        { status: 400 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, file.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // 🔥 NEW: Handle decompression based on client preferences
    let responseFile = file
    let responseHeaders: Record<string, string> = {}
    
    if (file.isCompressed && decompress === 'server') {
      // Server-side decompression requested
      console.log('🔥 Server-side decompression requested for:', file.id)
      
      try {
        // Create a mock compressed blob from the file data
        // In production, this would fetch the actual file from R2
        const compressedBlob = new Blob(['mock-compressed-data'], { type: 'application/octet-stream' })
        
        // Create compression metadata from database
        const compressionMetadata: CompressionMetadata = {
          isCompressed: file.isCompressed,
          compressionAlgo: file.compressionAlgo as any,
          originalFiles: file.meta as any || [],
          originalSize: Number(file.originalSize || file.sizeBytes),
          compressedSize: Number(file.sizeBytes),
          compressionRatio: file.compressionRatio || 1.0,
          clientCompressed: false
        }
        
        // Decompress on server
        const decompressionResult = await decompressFile(compressedBlob, compressionMetadata, {
          mode: 'server',
          extractSingle
        })
        
        if (extractSingle && decompressionResult.files.length > 0) {
          // Extract single file
          const extractedFile = decompressionResult.files[0]
          responseFile = {
            ...file,
            originalName: extractedFile.name,
            sizeBytes: BigInt(extractedFile.size),
            contentType: extractedFile.type || 'application/octet-stream'
          }
          responseHeaders['Content-Disposition'] = `attachment; filename="${extractedFile.name}"`
        } else {
          // Return all decompressed files as a ZIP
          responseFile = {
            ...file,
            originalName: `${file.originalName.replace(/\.[^/.]+$/, '')}_decompressed.zip`,
            contentType: 'application/zip'
          }
          responseHeaders['Content-Disposition'] = `attachment; filename="${responseFile.originalName}"`
        }
        
        console.log('✅ Server-side decompression completed')
      } catch (error) {
        console.error('❌ Server-side decompression failed:', error)
        // Fall back to client decompression
        responseHeaders['X-Compression-Fallback'] = 'client'
      }
    } else if (file.isCompressed && decompress === 'client') {
      // Client-side decompression (default)
      console.log('🔥 Client-side decompression requested for:', file.id)
      responseHeaders['X-Compression-Mode'] = 'client'
      responseHeaders['X-Compression-Algorithm'] = file.compressionAlgo || 'zip'
      responseHeaders['X-Original-Size'] = file.originalSize?.toString() || file.sizeBytes.toString()
      responseHeaders['X-Compression-Ratio'] = file.compressionRatio?.toString() || '1.0'
      
      if (file.meta) {
        responseHeaders['X-Original-Files'] = JSON.stringify(file.meta)
      }
    } else if (decompress === 'raw') {
      // Raw mode - return compressed file as-is
      console.log('🔥 Raw mode requested for:', file.id)
      responseHeaders['X-Compression-Mode'] = 'raw'
    }

    // Update download count and last access time
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        downloads: { increment: 1 },
        lastAccessAt: new Date()
      }
    })

    // Log the download access
    await prisma.accessLog.create({
      data: {
        fileId: file.id,
        event: 'DOWNLOAD',
        ip: 'unknown', // TODO: Get real IP from request
        ua: request.headers.get('user-agent') || null,
        ok: true,
        reason: null
      }
    })

    // In a real app, you'd stream the file from R2/S3 here
    // For demo, we'll return a success response
    return NextResponse.json({
      success: true,
      message: 'Download authorized',
      file: {
        id: updatedFile.id,
        name: responseFile.originalName,
        type: responseFile.contentType,
        size: Number(responseFile.sizeBytes),
        downloadCount: updatedFile.downloads,
        bucket: responseFile.bucket,
        key: responseFile.key,
        // 🔥 NEW: Compression pipeline info
        isCompressed: responseFile.isCompressed,
        compressionAlgo: responseFile.compressionAlgo,
        originalSize: responseFile.originalSize ? Number(responseFile.originalSize) : null,
        compressionRatio: responseFile.compressionRatio,
        decompressionMode: decompress,
        compressionHeaders: responseHeaders
      }
    }, {
      headers: responseHeaders
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
