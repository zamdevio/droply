// Import compression functions from WASM module
import { 
  processFiles,
  processFilesMeta,
  generateFileExtension,
  generateSmartFilename,
  type ProcessOptions,
  type ProcessMetadata
} from '../../../wasm';

// Import fallback for validation
import { 
  validateMetadata as validateMetadataFallback,
  type CompressedResult,
  type DecompressedResult
} from '@/wasm/fallback/compression';

// 🔥 NEW: Enhanced types for the compression pipeline
export interface CompressionMetadata {
  isCompressed: boolean;
  compressionAlgo: 'gzip' | 'brotli' | 'zip' | null;
  originalFiles: FileMeta[];
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  clientCompressed: boolean; // Whether client did the compression
  archiveType?: 'zip' | 'tar' | 'none';
  suggestedFilename?: string; // Generated filename with proper extension
}

export interface FileMeta {
  name: string;
  size: number;
  type: string;
  checksum?: string;
}

export interface CompressionOptions {
  algorithm?: 'gzip' | 'brotli' | 'zip';
  quality?: number; // 0-100 for lossy compression
  skipAlreadyCompressed?: boolean; // Skip JPEG, MP4, etc.
  archiveType?: 'zip' | 'tar' | 'none'; // Archive format for multiple files
}

export interface DecompressionOptions {
  mode: 'client' | 'server' | 'raw';
  extractSingle?: string; // Extract specific file from archive
}

export interface CompressedResult {
  zipBlob: Blob;
  meta: FileMeta[];
  compressionRatio: number;
  totalSize: number;
  compressedSize: number;
}

export interface DecompressedResult {
  files: File[];
  metadata?: CompressionMetadata;
}

// 🔥 NEW: Compression-aware file type detection
const COMPRESSIBLE_TYPES = [
  // All human-readable text
  'text/', // text/html, text/css, text/csv, text/plain, text/markdown, etc.

  // Data formats
  'application/json',
  'application/ld+json',
  'application/xml',
  'application/xhtml+xml',
  'application/javascript',
  'application/typescript',
  'application/x-www-form-urlencoded',

  // APIs / feeds
  'application/graphql',
  'application/rss+xml',
  'application/atom+xml',
  'application/manifest+json',
  'application/vnd.api+json',

  // Fonts
  'application/vnd.ms-fontobject',
  'application/x-font-ttf',
  'application/x-font-opentype',
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',

  // Images that aren’t natively compressed
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/bmp',
  'image/tiff'
];

const ALREADY_COMPRESSED_TYPES = [
  // Images (lossy/lossless)
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'image/heic', 'image/heif',

  // Video
  'video/mp4', 'video/webm', 'video/ogg', 'video/avi',
  'video/mpeg', 'video/quicktime', 'video/x-msvideo',

  // Audio
  'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac',
  'audio/webm', 'audio/flac',

  // Archives & binary containers
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/gzip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/octet-stream' // catch-all binaries
];


/**
 * 🔥 God-Tier Compression Manager
 * Implements the full compression pipeline: client-side compression, 
 * backend awareness, and flexible decompression options
 */
class CompressionManager {
  private wasmCompressor: any = null;
  private wasmDecompressor: any = null;
  private isWasmLoaded = false;

  constructor() {
    this.initWasm();
  }

  /**
   * Initialize WASM modules
   */
  private async initWasm() {
    try {
      // Use the new WASM index that auto-picks WASM or fallback
      const { initializeCompression } = await import('@/wasm/index');
      const wasmModule = await initializeCompression();
      
      if (wasmModule && wasmModule.compress_files && wasmModule.decompress_zip) {
        this.wasmCompressor = wasmModule;
        this.wasmDecompressor = wasmModule;
        this.isWasmLoaded = true;
        console.log('🔥 WASM compression loaded successfully!');
      } else {
        throw new Error('WASM module missing required functions');
      }
    } catch (error) {
      console.warn('⚠️ WASM failed, using TypeScript fallback:', error);
      this.isWasmLoaded = false;
    }
  }

  /**
   * 🔥 CLIENT-SIDE COMPRESSION (Primary Path)
   * This is the main compression function that clients call before upload
   */
  async compressFilesClient(
    files: File[], 
    options: CompressionOptions = {}
  ): Promise<{ compressedBlob: Blob; metadata: CompressionMetadata }> {
    const {
      algorithm = 'zip',
      quality = 80,
      skipAlreadyCompressed = true
    } = options;

    // Check if files should be compressed
    const shouldCompress = this.shouldCompressFiles(files, skipAlreadyCompressed);
    
    if (!shouldCompress) {
      // Return single file or create minimal archive
      if (files.length === 1) {
        return {
          compressedBlob: files[0],
          metadata: {
            isCompressed: false,
            compressionAlgo: null,
            originalFiles: this.createFileMeta(files),
            originalSize: files[0].size,
            compressedSize: files[0].size,
            compressionRatio: 1.0,
            clientCompressed: false
          }
        };
      }
    }

    // Perform compression
    const compressedResult = await this.compressFiles(files);
    
    // Calculate compression ratio
    const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0);
    const compressionRatio = compressedResult.compressedSize / totalOriginalSize;

    return {
      compressedBlob: compressedResult.zipBlob,
      metadata: {
        isCompressed: true,
        compressionAlgo: algorithm,
        originalFiles: compressedResult.meta,
        originalSize: totalOriginalSize,
        compressedSize: compressedResult.compressedSize,
        compressionRatio,
        clientCompressed: true
      }
    };
  }

  /**
   * 🔥 BACKEND COMPRESSION (Server-side fallback)
   * Used when client doesn't compress or for server-side optimization
   */
  async compressFilesServer(
    files: File[],
    options: CompressionOptions = {}
  ): Promise<{ compressedBlob: Blob; metadata: CompressionMetadata }> {
    const {
      algorithm = 'zip',
      quality = 80
    } = options;

    // Always compress on server for consistency
    const compressedResult = await this.compressFiles(files);
    
    const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0);
    const compressionRatio = compressedResult.compressedSize / totalOriginalSize;

    return {
      compressedBlob: compressedResult.zipBlob,
      metadata: {
        isCompressed: true,
        compressionAlgo: algorithm,
        originalFiles: compressedResult.meta,
        originalSize: totalOriginalSize,
        compressedSize: compressedResult.compressedSize,
        compressionRatio,
        clientCompressed: false
      }
    };
  }

  /**
   * 🔥 SMART DECOMPRESSION
   * Handles decompression based on client preferences and file state
   */
  async decompressFile(
    compressedBlob: Blob,
    metadata: CompressionMetadata,
    options: DecompressionOptions
  ): Promise<{ files: File[]; metadata: CompressionMetadata }> {
    const { mode, extractSingle } = options;

    switch (mode) {
      case 'raw':
        // Return compressed blob as-is
        return {
          files: [new File([compressedBlob], 'compressed.archive', { type: 'application/octet-stream' })],
          metadata
        };

      case 'server':
        // Server decompresses and returns individual files
        const decompressedResult = await this.decompressFiles(compressedBlob);
        return {
          files: decompressedResult.files,
          metadata: {
            ...metadata,
            isCompressed: false,
            compressionAlgo: null
          }
        };

      case 'client':
      default:
        // Return compressed blob + metadata for client decompression
        return {
          files: [new File([compressedBlob], 'compressed.archive', { type: 'application/octet-stream' })],
          metadata
        };
    }
  }

  /**
   * 🔥 EXTRACT SINGLE FILE
   * Extract specific file from compressed archive
   */
  async extractSingleFile(
    compressedBlob: Blob, 
    filename: string
  ): Promise<File | null> {
    if (this.isWasmLoaded && this.wasmDecompressor) {
      try {
        return await this.extractSingleFileWasm(compressedBlob, filename);
      } catch (error) {
        console.warn('🔄 WASM extraction failed, falling back to TypeScript:', error);
        return this.extractSingleFileTS(compressedBlob, filename);
      }
    } else {
      return this.extractSingleFileTS(compressedBlob, filename);
    }
  }

  /**
   * 🔥 VALIDATE COMPRESSION METADATA
   * Verify that compressed archive matches expected metadata
   */
  async validateCompressionMetadata(
    compressedBlob: Blob, 
    expectedMeta: CompressionMetadata
  ): Promise<boolean> {
    if (!expectedMeta.isCompressed) return true;
    
    try {
      const decompressedResult = await this.decompressFiles(compressedBlob);
      
      // Check file count
      if (decompressedResult.files.length !== expectedMeta.originalFiles.length) {
        return false;
      }

      // Check individual files
      return expectedMeta.originalFiles.every(expected => 
        decompressedResult.files.some(actual => 
          actual.name === expected.name && 
          actual.size === expected.size
        )
      );
    } catch (error) {
      console.error('❌ Metadata validation failed:', error);
      return false;
    }
  }

  // 🔥 PRIVATE HELPER METHODS

  private shouldCompressFiles(files: File[], skipAlreadyCompressed: boolean): boolean {
    if (files.length === 1) {
      const file = files[0];
      if (skipAlreadyCompressed && ALREADY_COMPRESSED_TYPES.includes(file.type)) {
        return false;
      }
      // Only compress if it's a compressible type
      return COMPRESSIBLE_TYPES.some(type => file.type.startsWith(type));
    }
    
    // Multiple files should always be compressed
    return true;
  }

  private createFileMeta(files: File[]): FileMeta[] {
    return files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      checksum: '' // TODO: Calculate checksum
    }));
  }

  // 🔥 EXISTING COMPRESSION METHODS (Enhanced)

  async compressFiles(files: File[]): Promise<CompressedResult> {
    try {
      // Convert File[] to FileTuple[] for WASM
      const fileTuples = await Promise.all(files.map(async (file) => ({
        name: file.name,
        data: new Uint8Array(await file.arrayBuffer())
      })));

      // Use the new WASM module with proper options
      const options: ProcessOptions = {
        compression: { algo: 'gzip', level: 6 },
        archive: files.length > 1 ? { algo: 'zip', compressInside: false } : false
      };

      const result = await processFiles(fileTuples, options);
      
      // Convert to our expected format
      return {
        zipBlob: new Blob([result], { type: 'application/zip' }),
        meta: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          checksum: '' // TODO: Calculate checksum
        })),
        compressionRatio: 0, // Will be calculated later
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        compressedSize: result.length
      };
    } catch (error) {
      console.warn('🔄 Compression failed, using fallback:', error);
      return this.compressFilesTS(files);
    }
  }

  async compressFilesWithMetadata(files: File[]): Promise<{ data: Uint8Array; metadata: ProcessMetadata }> {
    try {
      // Convert File[] to FileTuple[] for WASM
      const fileTuples = await Promise.all(files.map(async (file) => ({
        name: file.name,
        data: new Uint8Array(await file.arrayBuffer())
      })));

      // Use the new WASM module with metadata
      const options: ProcessOptions = {
        compression: { algo: 'gzip', level: 6 },
        archive: files.length > 1 ? { algo: 'zip', compressInside: false } : false
      };

      return await processFilesMeta(fileTuples, options);
    } catch (error) {
      console.warn('🔄 Compression with metadata failed:', error);
      throw error;
    }
  }

  // 🔥 NEW: Generate proper filename with extension
  generateFilename(
    originalName: string,
    options: {
      archive?: 'zip' | 'tar' | 'none';
      compression?: 'gzip' | 'brotli' | 'zip' | 'none';
      timestamp?: boolean;
    } = {}
  ): string {
    const { archive = 'none', compression = 'none', timestamp = false } = options;
    
    // Use the WASM utility for consistent naming
    return generateSmartFilename(originalName, {
      archive: archive === 'none' ? 'none' : archive,
      compression: compression === 'none' ? 'none' : compression,
      timestamp
    });
  }

  async decompressFiles(zipBlob: Blob | File): Promise<DecompressedResult> {
    if (this.isWasmLoaded && this.wasmDecompressor) {
      try {
        return await this.decompressFilesWasm(zipBlob);
      } catch (error) {
        console.warn('🔄 WASM decompression failed, falling back to TypeScript:', error);
        return this.decompressFilesTS(zipBlob);
      }
    } else {
      return this.decompressFilesTS(zipBlob);
    }
  }

  // 🔥 WASM Implementation - Now uses actual WASM functions!
  private async compressFilesWasm(files: File[]): Promise<CompressedResult> {
    if (!this.wasmCompressor || !this.wasmCompressor.compress_files) {
      throw new Error('WASM compressor not available');
    }

    // Convert files to the format expected by Rust WASM
    const fileData = await Promise.all(files.map(async (file) => ({
      name: file.name,
      data: new Uint8Array(await file.arrayBuffer())
    })));

    // Call WASM compression
    const compressedData = this.wasmCompressor.compress_files(fileData);
    
    // Convert back to our expected format
    return {
      zipBlob: new Blob([compressedData], { type: 'application/zip' }),
      meta: files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        checksum: '' // TODO: Calculate checksum
      })),
      compressionRatio: 0.8, // TODO: Calculate actual ratio
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      compressedSize: compressedData.length
    };
  }

  private async decompressFilesWasm(zipBlob: Blob | File): Promise<DecompressedResult> {
    if (!this.wasmDecompressor || !this.wasmDecompressor.decompress_zip) {
      throw new Error('WASM decompressor not available');
    }

    // Convert blob to Uint8Array for WASM
    const arrayBuffer = await zipBlob.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);

    // Call WASM decompression
    const decompressedFiles = this.wasmDecompressor.decompress_zip(zipData);
    
    // Convert back to our expected format
    const files = decompressedFiles.map((file: any) => 
      new File([file.data], file.name, { type: 'application/octet-stream' })
    );

    return {
      files,
      meta: files.map((file: File) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        checksum: '' // TODO: Calculate checksum
      }))
    };
  }

  private async extractSingleFileWasm(zipBlob: Blob | File, filename: string): Promise<File | null> {
    const result = await this.decompressFilesWasm(zipBlob);
    return result.files.find(f => f.name === filename) || null;
  }

  // 🔥 TypeScript Fallback Implementation - Now just calls imported functions!
  private async compressFilesTS(files: File[]): Promise<CompressedResult> {
    return processFiles(files);
  }

  private async decompressFilesTS(zipBlob: Blob | File): Promise<DecompressedResult> {
    return decompressFilesFallback(zipBlob);
  }

  private async extractSingleFileTS(zipBlob: Blob | File, filename: string): Promise<File | null> {
    return extractSingleFileFallback(zipBlob, filename);
  }

  // Public utility methods
  isWasmAvailable(): boolean {
    return this.isWasmLoaded;
  }

  async reloadWasm(): Promise<void> {
    this.isWasmLoaded = false;
    this.wasmCompressor = null;
    this.wasmDecompressor = null;
    await this.initWasm();
  }

  // 🔥 NEW: Utility methods for the compression pipeline
  isCompressibleFile(file: File): boolean {
    return COMPRESSIBLE_TYPES.some(type => file.type.startsWith(type));
  }

  isAlreadyCompressed(file: File): boolean {
    return ALREADY_COMPRESSED_TYPES.includes(file.type);
  }

  getCompressionRecommendation(files: File[]): {
    [x: string]: any;
    shouldCompress: boolean;
    reason: string;
    algorithm: 'zip' | 'zstd' | 'brotli';
  } {
    if (files.length === 1) {
      const file = files[0];
      if (this.isAlreadyCompressed(file)) {
        return {
          shouldCompress: false,
          reason: 'File is already compressed',
          algorithm: 'zip'
        };
      }
      if (this.isCompressibleFile(file)) {
        return {
          shouldCompress: true,
          reason: 'File type benefits from compression',
          algorithm: 'zip'
        };
      }
      return {
        shouldCompress: false,
        reason: 'File type unlikely to benefit from compression',
        algorithm: 'zip'
      };
    }

    // Multiple files should always be compressed
    return {
      shouldCompress: true,
      reason: 'Multiple files benefit from archiving',
      algorithm: 'zip'
    };
  }
}

// Export singleton instance
export const compressionManager = new CompressionManager();

// 🔥 NEW: Export the enhanced compression pipeline functions
export const compressFilesClient = (files: File[], options?: CompressionOptions) => 
  compressionManager.compressFilesClient(files, options);

export const compressFilesServer = (files: File[], options?: CompressionOptions) => 
  compressionManager.compressFilesServer(files, options);

export const decompressFile = (compressedBlob: Blob, metadata: CompressionMetadata, options: DecompressionOptions) => 
  compressionManager.decompressFile(compressedBlob, metadata, options);

export const validateCompressionMetadata = (compressedBlob: Blob, expectedMeta: CompressionMetadata) => 
  compressionManager.validateCompressionMetadata(compressedBlob, expectedMeta);

  // Export existing functions for backward compatibility
  export const compressFiles = (files: File[]) => compressionManager.compressFiles(files);
  export const decompressFiles = (zipBlob: Blob | File) => compressionManager.decompressFiles(zipBlob);
  export const extractSingleFile = (zipBlob: Blob | File, filename: string) => compressionManager.extractSingleFile(zipBlob, filename);
  
  // Export utility functions
  export const isCompressibleFile = (file: File) => compressionManager.isCompressibleFile(file);
  export const isAlreadyCompressed = (file: File) => compressionManager.isAlreadyCompressed(file);
  export const getCompressionRecommendation = (files: File[]) => compressionManager.getCompressionRecommendation(files);
  
  // Export all types
  export type { 
    FileMeta, 
    CompressedResult, 
    DecompressedResult
  };
