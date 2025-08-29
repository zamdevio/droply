import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Global Prisma instance with connection pooling
declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling for high performance
  __internal: {
    engine: {
      connectionLimit: 20,
      pool: {
        min: 2,
        max: 10,
      },
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

/**
 * High-performance file lookup with caching
 */
export async function getFileById(fileId: string) {
  return prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      originalName: true,
      contentType: true,
      sizeBytes: true,
      passwordHash: true,
      maxDownloads: true,
      downloads: true,
      isPublic: true,
      expiresAt: true,
      lastAccessAt: true,
      status: true,
      meta: true,
      createdAt: true,
    },
  })
}

/**
 * High-performance file lookup with password verification
 */
export async function getFileWithPassword(fileId: string, password?: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      originalName: true,
      contentType: true,
      sizeBytes: true,
      passwordHash: true,
      maxDownloads: true,
      downloads: true,
      isPublic: true,
      expiresAt: true,
      lastAccessAt: true,
      status: true,
      meta: true,
      createdAt: true,
    },
  })

  if (!file) return null

  // Check if file is expired
  if (file.expiresAt && file.expiresAt < new Date()) {
    return { ...file, status: 'EXPIRED' as const }
  }

  // Check if file is deleted or blocked
  if (file.status !== 'ACTIVE') {
    return file
  }

  // If file has password protection, password is required
  if (file.passwordHash && !password) {
    return { ...file, requiresPassword: true }
  }

  // If password is provided, verify it
  if (file.passwordHash && password) {
    const { verifyPassword } = await import('./password')
    const isValid = await verifyPassword(password, file.passwordHash)
    if (!isValid) {
      return { ...file, passwordInvalid: true }
    }
  }

  return file
}

/**
 * High-performance file update with ownership validation
 */
export async function updateFileWithOwnership(
  fileId: string, 
  updates: any, 
  password?: string
) {
  // First check ownership
  const file = await getFileWithPassword(fileId, password)
  
  if (!file) {
    throw new Error('File not found')
  }

  if (file.status !== 'ACTIVE') {
    throw new Error('File is not active')
  }

  // Check if file requires password but none provided
  if (file.passwordHash) {
    throw new Error('This file requires a password for ownership verification')
  }

  // Check if password is invalid
  if (file.passwordHash && password) {
    const isValid = await bcrypt.compare(password, file.passwordHash)
    if (!isValid) {
      throw new Error('Invalid password for this file')
    }
  }

  // If file has no password protection, it cannot be modified
  if (!file.passwordHash) {
    throw new Error('This file has no password protection and cannot be modified')
  }

  // Update the file
  return prisma.file.update({
    where: { id: fileId },
    data: updates,
  })
}

/**
 * High-performance file deletion with ownership validation
 */
export async function deleteFileWithOwnership(
  fileId: string, 
  password?: string
) {
  // First check ownership
  const file = await getFileWithPassword(fileId, password)
  
  if (!file) {
    throw new Error('File not found')
  }

  if (file.status !== 'ACTIVE') {
    throw new Error('File is not active')
  }

  // Check if file requires password but none provided
  if (file.passwordHash) {
    throw new Error('This file requires a password for ownership verification')
  }

  // Check if password is invalid
  if (file.passwordHash && password) {
    const isValid = await bcrypt.compare(password, file.passwordHash)
    if (!isValid) {
      throw new Error('Invalid password for this file')
    }
  }

  // If file has no password protection, it cannot be deleted
  if (!file.passwordHash) {
    throw new Error('This file has no password protection and cannot be deleted')
  }

  // Soft delete the file
  return prisma.file.update({
    where: { id: fileId },
    data: { 
      status: 'DELETED',
      deletedAt: new Date()
    },
  })
}

/**
 * High-performance access logging
 */
export async function logAccess(
  fileId: string, 
  event: 'INFO' | 'DOWNLOAD' | 'DELETE' | 'EDIT',
  ip: string,
  userAgent: string,
  success: boolean,
  reason?: string
) {
  return prisma.accessLog.create({
    data: {
      fileId,
      event,
      ip,
      ua: userAgent,
      ok: success,
      reason,
    },
  })
}

/**
 * High-performance download tracking
 */
export async function trackDownload(fileId: string) {
  return prisma.file.update({
    where: { id: fileId },
    data: {
      downloads: { increment: 1 },
      lastAccessAt: new Date(),
    },
  })
}

/**
 * Batch cleanup of expired files
 */
export async function cleanupExpiredFiles() {
  const expiredFiles = await prisma.file.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: 'ACTIVE',
    },
    select: { id: true },
  })

  if (expiredFiles.length > 0) {
    await prisma.file.updateMany({
      where: {
        id: { in: expiredFiles.map(f => f.id) },
      },
      data: { status: 'EXPIRED' },
    })
  }

  return expiredFiles.length
}

/**
 * Health check for database
 */
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { healthy: true, timestamp: new Date() }
  } catch (error) {
    return { healthy: false, error: error.message, timestamp: new Date() }
  }
}
