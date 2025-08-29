import { PrismaClient } from '@prisma/client'
import { isDemoMode } from './env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In demo mode, we'll create a mock Prisma client
const createMockPrisma = () => {
  return {
    file: {
      create: async (data: any) => {
        console.log('[DEMO] Would create file:', data);
        return {
          id: 'demo_' + Math.random().toString(36).substr(2, 9),
          originalName: data.data.originalName,
          contentType: data.data.contentType,
          expiresAt: data.data.expiresAt,
          key: data.data.key,
        };
      },
      findUnique: async (params: any) => {
        console.log('[DEMO] Would find file:', params);
        return {
          id: params.where.id,
          originalName: 'Demo File',
          contentType: 'text/plain',
          sizeBytes: BigInt(1024),
          expiresAt: null,
          downloads: 0,
          maxDownloads: null,
          status: 'ACTIVE',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          bucket: 'demo',
          key: 'demo/file.txt',
          checksum: 'demo_checksum_' + Math.random().toString(36).substr(2, 9),
          passwordHash: 'demo_hash_' + Math.random().toString(36).substr(2, 9),
          ownerId: null,
          lastAccessAt: new Date(),
        };
      },
      update: async (params: any) => {
        console.log('[DEMO] Would update file:', params);
        return { id: params.where.id };
      },
    },
    accessLog: {
      create: async (data: any) => {
        console.log('[DEMO] Would create access log:', data);
        return { id: BigInt(1) };
      },
    },
  } as any;
};

export const prisma = isDemoMode 
  ? createMockPrisma()
  : (globalForPrisma.prisma ?? new PrismaClient());

if (process.env.NODE_ENV !== 'production' && !isDemoMode) {
  globalForPrisma.prisma = prisma;
}
