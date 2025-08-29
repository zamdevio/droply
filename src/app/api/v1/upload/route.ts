import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isDemoMode } from '@/lib/env'
import { generateFileId, calculateExpiryDate } from '@/lib/fileStorage'
import { 
  validateMetadata, 
  FileMeta,
  CompressionMetadata,
  compressFilesServer,
  validateCompressionMetadata
} from '@/lib/utils/compression'
import { hashPassword, validatePasswordStrength } from '@/lib/password'
import { logAccess } from '@/lib/db'

const UploadSchema = z.object({
  file: z.any(), // File object from FormData
  isSingleFile: z.string().transform(val => val === 'true'), // Convert string to boolean
  password: z.string().min(6).max(12).nullable().optional(), // Allow string, null, or undefined
  expiresIn: z.enum(['1h', '1d', '7d', '30d', 'never']).default('7d'),
  maxDownloads: z.number().min(1).max(1000).optional(),
  contentType: z.string().default('text/plain'),
  meta: z.string().nullable().optional(), // Allow string, null, or undefined
  checksum: z.string().nullable().optional(), // Allow string, null, or undefined
  // 🔥 NEW: Compression pipeline fields
  compressionMetadata: z.string().nullable().optional(), // JSON string of CompressionMetadata
  isCompressed: z.string().transform(val => val === 'true').optional(), // Whether client compressed
  compressionAlgo: z.string().optional(), // Compression algorithm used
  originalSize: z.string().transform(val => val ? BigInt(val) : undefined).optional(), // Original size before compression
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Debug: Log all FormData entries
    console.log('🔍 FormData received:')
    Array.from(formData.entries()).forEach(([key, value]) => {
      console.log(`  ${key}: ${value} (type: ${typeof value})`)
    })
    
    const file = formData.get('file') as File
    const isSingleFile = formData.get('isSingleFile') as string
    const password = (formData.get('password') as string) || undefined // Convert null to undefined
    const expiresIn = formData.get('expiresIn') as string
    const maxDownloads = formData.get('maxDownloads') ? parseInt(formData.get('maxDownloads') as string) : undefined
    const metaString = (formData.get('meta') as string) || undefined // Convert null to undefined
    const checksum = (formData.get('checksum') as string) || undefined // Convert null to undefined
    // 🔥 NEW: Compression pipeline fields
    const compressionMetadataString = (formData.get('compressionMetadata') as string) || undefined
    const isCompressed = (formData.get('isCompressed') as string) || undefined
    const compressionAlgo = (formData.get('compressionAlgo') as string) || undefined
    const originalSize = (formData.get('originalSize') as string) || undefined

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'File too large',
        message: 'Files larger than 100MB are not allowed',
      }, { status: 400 })
    }

    // Validate password if provided
    let passwordHash: string | null = null
    if (password && password.trim() !== '') {
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.isValid) {
        return NextResponse.json({
          success: false,
          error: 'Invalid password',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors,
        }, { status: 400 })
      }
      
      // Hash the password
      passwordHash = await hashPassword(password)
    }

    // Parse metadata if provided
    let meta: FileMeta[] | null = null
    if (metaString && metaString.trim() !== '') {
      try {
        meta = JSON.parse(metaString) as FileMeta[]
      } catch (error) {
        console.error('❌ Invalid metadata format:', error)
        return NextResponse.json({
          success: false,
          error: 'Invalid metadata format',
          message: 'The metadata provided is not valid JSON',
        }, { status: 400 })
      }
    }

    // 🔥 NEW: Parse compression metadata if provided
    let compressionMetadata: CompressionMetadata | null = null
    if (compressionMetadataString && compressionMetadataString.trim() !== '') {
      try {
        compressionMetadata = JSON.parse(compressionMetadataString) as CompressionMetadata
      } catch (error) {
        console.error('❌ Invalid compression metadata format:', error)
        return NextResponse.json({
          success: false,
          error: 'Invalid compression metadata format',
          message: 'The compression metadata provided is not valid JSON',
        }, { status: 400 })
      }
    }

    // Validate input
    const validationData = {
      file,
      isSingleFile,
      password: password || null, // Pass null if not provided
      expiresIn,
      maxDownloads,
      contentType: file?.type || 'text/plain',
      meta: metaString || null, // Pass null if not provided
      checksum: checksum || null // Pass null if not provided
    }
    
    console.log('🔍 Validation data:', validationData)
    
    const validation = UploadSchema.safeParse(validationData)

    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.errors)
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
        receivedData: validationData, // Include what was received for debugging
      }, { status: 400 })
    }

    const { isSingleFile: validatedIsSingleFile, expiresIn: validatedExpiresIn, maxDownloads: validatedMaxDownloads, contentType } = validation.data

    // 🔥 NEW: Handle compression validation and processing
    let finalFile = file
    let finalMeta = meta
    let finalIsCompressed = false
    let finalCompressionAlgo: string | null = null
    let finalOriginalSize: bigint | null = null
    let finalCompressionRatio: number | null = null

    // If client provided compression metadata, validate it
    if (compressionMetadata && compressionMetadata.isCompressed) {
      console.log('🔥 Client-side compression detected:', compressionMetadata)
      
      // Validate compression metadata matches the file
      const isValidCompression = await validateCompressionMetadata(file, compressionMetadata)
      if (!isValidCompression) {
        return NextResponse.json({
          success: false,
          error: 'Compression metadata corrupted',
          message: 'The compression metadata does not match the file contents',
        }, { status: 400 })
      }

      // Use client compression data
      finalIsCompressed = true
      finalCompressionAlgo = compressionMetadata.compressionAlgo
      finalOriginalSize = BigInt(compressionMetadata.originalSize)
      finalCompressionRatio = compressionMetadata.compressionRatio
      finalMeta = compressionMetadata.originalFiles
      
      console.log('✅ Client compression validated successfully')
    } else if (isCompressed === 'true') {
      // Client marked as compressed but no metadata - this is an error
      return NextResponse.json({
        success: false,
        error: 'Compression metadata required',
        message: 'File marked as compressed but no compression metadata provided',
      }, { status: 400 })
    } else {
      // No client compression - check if we should compress server-side
      console.log('🔄 No client compression, checking server-side compression...')
      
      if (!validatedIsSingleFile || file.type === 'application/zip') {
        // Multiple files or ZIP - validate existing compression
        if (file.type === 'application/zip' && meta) {
          const isValid = await validateMetadata(file, meta)
          if (!isValid) {
            return NextResponse.json({
              success: false,
              error: 'Metadata corrupted',
              message: 'The provided metadata does not match the ZIP file contents',
            }, { status: 400 })
          }
          // ZIP file with valid metadata - treat as compressed
          finalIsCompressed = true
          finalCompressionAlgo = 'zip'
          finalOriginalSize = BigInt(meta.reduce((sum, f) => sum + f.size, 0))
          finalCompressionRatio = file.size / Number(finalOriginalSize)
        }
      } else {
        // Single file - check if it would benefit from compression
        const shouldCompress = file.type.startsWith('text/') || 
                              file.type.startsWith('application/') ||
                              file.type === 'image/svg+xml' ||
                              file.type === 'image/bmp' ||
                              file.type === 'image/tiff'
        
        if (shouldCompress && file.size > 1024 * 1024) { // Only compress files > 1MB
          console.log('🔥 Server-side compression recommended for:', file.name)
          try {
            const compressionResult = await compressFilesServer([file])
            finalFile = compressionResult.compressedBlob as File
            finalIsCompressed = true
            finalCompressionAlgo = compressionResult.metadata.compressionAlgo
            finalOriginalSize = BigInt(compressionResult.metadata.originalSize)
            finalCompressionRatio = compressionResult.metadata.compressionRatio
            finalMeta = compressionResult.metadata.originalFiles
            
            console.log('✅ Server-side compression completed:', {
              originalSize: finalOriginalSize,
              compressedSize: finalFile.size,
              ratio: finalCompressionRatio
            })
          } catch (error) {
            console.warn('⚠️ Server-side compression failed, using original file:', error)
          }
        }
      }
    }

    // Handle metadata validation based on isSingleFile flag
    if (!validatedIsSingleFile) {
      // Multiple files (ZIP) - metadata is required and must be valid
      if (!finalMeta || finalMeta.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Metadata required for ZIP files',
          message: 'ZIP files must include metadata for validation',
        }, { status: 400 })
      }

      // Validate that file is actually a ZIP
      if (finalFile.type !== 'application/zip') {
        return NextResponse.json({
          success: false,
          error: 'Invalid file type',
          message: 'Multiple files must be compressed into a ZIP file',
        }, { status: 400 })
      }
    } else {
      // Single file - metadata should be null or single file metadata
      if (finalMeta && finalMeta.length > 1) {
        return NextResponse.json({
          success: false,
          error: 'Invalid metadata for single file',
          message: 'Single files should not include multiple file metadata',
        }, { status: 400 })
      }
    }

    // Demo mode handling
    if (isDemoMode) {
      const demoFileId = generateFileId()
      const demoExpiryDate = calculateExpiryDate(validatedExpiresIn)
      
      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully (demo mode)',
        data: {
          fileId: demoFileId,
          originalName: file.name,
          size: file.size,
          contentType: file.type || contentType,
          expiresAt: demoExpiryDate,
          maxDownloads: validatedMaxDownloads,
          meta: finalMeta, // Include metadata in demo response
          isSingleFile: validatedIsSingleFile,
          fileCount: finalMeta ? finalMeta.length : 1,
          hasPassword: !!password,
          // 🔥 NEW: Compression pipeline info
          isCompressed: finalIsCompressed,
          compressionAlgo: finalCompressionAlgo,
          originalSize: finalOriginalSize ? Number(finalOriginalSize) : null,
          compressionRatio: finalCompressionRatio,
          downloadUrl: `/download/${demoFileId}`,
          infoUrl: `/info/${demoFileId}`,
          deleteUrl: `/delete/${demoFileId}`,
          editUrl: `/edit/${demoFileId}`,
          checksum: checksum, // Include checksum in demo response
          // Important: Store this fileId locally for later access
          storeLocally: true,
          message: 'Store this fileId in your local storage to access this file later'
        }
      })
    }

    // Real upload logic
    try {
      // Generate unique file ID
      const fileId = generateFileId()
      
      // Calculate expiry date
      const expiresAt = calculateExpiryDate(validatedExpiresIn)
      
      // Store file metadata in database FIRST (before R2)
      const savedFile = await prisma.file.create({
        data: {
          id: fileId,
          originalName: finalFile.name,
          sizeBytes: BigInt(finalFile.size), // Convert to BigInt as required by schema
          contentType: finalFile.type || contentType,
          passwordHash: passwordHash, // Store hashed password
          expiresAt,
          maxDownloads: validatedMaxDownloads || null,
          status: 'ACTIVE',
          checksum: checksum, // Use the actual checksum from the request
          meta: finalMeta, // Store metadata for ZIP files, null for single files
          // 🔥 NEW: Compression pipeline fields
          isCompressed: finalIsCompressed,
          compressionAlgo: finalCompressionAlgo,
          originalSize: finalOriginalSize,
          compressionRatio: finalCompressionRatio,
          bucket: 'droply', // Placeholder for R2
          key: `files/${fileId}/${finalFile.name}`, // Placeholder for R2 key
        }
      })

      // Log the upload
      await logAccess(
        fileId,
        'INFO', // Changed from 'UPLOAD' to 'INFO' to match the allowed types
        '127.0.0.1', // Extract real IP from request
        request.headers.get('user-agent') || 'Unknown',
        true
      )

      // TODO: In production, upload actual file to R2/cloud storage
      console.log(`File ${fileId} metadata saved to database. File upload to cloud storage not implemented yet.`)

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileId,
          originalName: file.name,
          size: file.size, // Size in bytes for frontend compatibility
          contentType: file.type || contentType,
          expiresAt,
          maxDownloads: validatedMaxDownloads,
          meta: finalMeta, // Include metadata in response
          isSingleFile: validatedIsSingleFile,
          fileCount: finalMeta ? finalMeta.length : 1,
          hasPassword: !!password,
          // 🔥 NEW: Compression pipeline info
          isCompressed: finalIsCompressed,
          compressionAlgo: finalCompressionAlgo,
          originalSize: finalOriginalSize ? Number(finalOriginalSize) : null,
          compressionRatio: finalCompressionRatio,
          checksum: checksum, // Include checksum in response
          downloadUrl: `/download/${fileId}`,
          infoUrl: `/info/${fileId}`,
          deleteUrl: `/delete/${fileId}`,
          editUrl: `/edit/${fileId}`,
          // Important: Store this fileId locally for later access
          storeLocally: true,
          message: 'Store this fileId in your local storage to access this file later',
          // Additional info for local storage
          uploadDate: new Date().toISOString(),
          expiryInfo: validatedExpiresIn === 'never' ? 'Never expires' : `Expires in ${validatedExpiresIn}`,
          isZipFile: !validatedIsSingleFile && file.type === 'application/zip',
          compressionInfo: !validatedIsSingleFile ? `Compressed ${meta?.length || 0} files into ZIP` : 'Single file upload',
          ownershipNote: password ? 'This file is password-protected and can be edited/deleted' : 'This file has no password protection and cannot be modified'
        }
      })

    } catch (dbError) {
      console.error('Database error during upload:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to save file metadata',
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred during upload',
    }, { status: 500 })
  }
}
