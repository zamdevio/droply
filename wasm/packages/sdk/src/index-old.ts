// index.ts
import { getCompressor } from './utils/compressor';
import { getArchiver, packWithMetadata, unpackWithMetadata, compressWithMetadata, decompressWithMetadata } from './utils/archiver';
import type { CompressionAlgo, ArchiveAlgo, ProcessOptions, ProcessMetadata } from './utils/types';
import { Registry } from './registry';
// 🔥 NEW: File extension utilities
import { 
  generateFileExtension, 
  parseFileExtension, 
  generateSmartFilename, 
  validateFilenameConvention,
  getSupportedExtensions 
} from './utils/extensions';

// Performance API for timing measurements
declare const performance: { now(): number };

type FileTuple = { name: string; data: Uint8Array };

// Create registry instance for validation
const registry = new Registry();

// Validate file tuple
function validateFileTuple(file: FileTuple): void {
  if (!file.name || file.name.trim() === '') {
    throw new Error('File name cannot be empty');
  }
  if (!file.data || file.data.length === 0) {
    throw new Error('File data cannot be empty');
  }
}

// Validate compression options
async function validateCompressionOptions(compression: { algo: CompressionAlgo; level?: number }): Promise<void> {
  if (!compression.algo) {
    throw new Error('Compression algorithm is required');
  }
  
  if (!(await registry.isCompressionAlgorithmSupported(compression.algo))) {
    throw new Error(`Unsupported compression algorithm: ${compression.algo}`);
  }
  
  if (compression.level !== undefined) {
    const maxLevel = compression.algo === 'brotli' ? 11 : 9;
    if (compression.level < 0 || compression.level > maxLevel) {
      throw new Error(`${compression.algo} compression level must be 0-${maxLevel}`);
    }
  }
}

// Validate archive options
async function validateArchiveOptions(archive: { algo: ArchiveAlgo; compressInside?: boolean }): Promise<void> {
  if (!archive.algo) {
    throw new Error('Archive algorithm is required');
  }
  
  if (!(await registry.isArchiveFormatSupported(archive.algo))) {
    throw new Error(`Unsupported archive algorithm: ${archive.algo}`);
  }
  
  // compressInside is optional, defaults to false for better performance
  if (archive.compressInside === undefined) {
    archive.compressInside = false;
  }
}

// High-level: compress one or many files.
// If >1 file and archive not disabled, we pack first then compress.
// NEW: No more metadata embedding - clean compression only
export async function processFiles(
  files: FileTuple[],
  options: ProcessOptions
): Promise<Uint8Array> {
  // Validate inputs
  if (!files || files.length === 0) {
    throw new Error('At least one file is required');
  }
  
  if (!options || !options.compression) {
    throw new Error('Compression options are required');
  }
  
  files.forEach(validateFileTuple);
  
  const compression = options.compression;
  const archiveCfg = options.archive ?? (files.length > 1 ? { algo: 'zip' } : false);
  
  // Validate options
  await validateCompressionOptions(compression);
  if (archiveCfg) {
    await validateArchiveOptions(archiveCfg);
  }

  let payload: Uint8Array;

  if (files.length > 1 && archiveCfg) {
    // Use clean archiver - NO metadata embedding
    const archiver = await getArchiver(archiveCfg.algo);
    payload = await archiver.pack(files);
  } else {
    // Single file - clean compression only, NO metadata embedding
    const compressor = await getCompressor(compression.algo);
    payload = await compressor.compress(files[0].data, { level: compression.level });
  }

  return payload;
}

// 🧠 Enhanced version with metadata for production use
export async function processFilesMeta(
  files: FileTuple[],
  options: ProcessOptions
): Promise<{ data: Uint8Array; meta: ProcessMetadata }> {
  if (!options || !options.compression) {
    throw new Error('Compression options are required');
  }
  
  const startTime = performance.now();
  
  // Calculate original sizes and prepare file details
  const fileDetails = files.map(f => ({
    name: f.name,
    originalSize: f.data.length,
    relativePath: f.name // For now, just the filename
  }));
  const totalOriginalSize = fileDetails.reduce((sum, f) => sum + f.originalSize, 0);
  
  // Process files (reuse existing logic)
  const data = await processFiles(files, options);
  
  // Calculate compression metrics
  const compressedSize = data.length;
  const compressionRatio = ((totalOriginalSize - compressedSize) / totalOriginalSize * 100);
  const processingTime = performance.now() - startTime;
  
  // Generate simple checksums (for now, just length-based)
  const checksums = {
    original: `size_${totalOriginalSize}_count_${files.length}`,
    compressed: `size_${compressedSize}_algo_${options.compression.algo}`
  };
  
  // Build enhanced metadata
  const meta: ProcessMetadata = {
    originalSize: totalOriginalSize,
    compressedSize,
    compressionRatio: Math.round(compressionRatio * 100) / 100, // Round to 2 decimal places
    compression: options.compression.algo,
    archive: options.archive && typeof options.archive === 'object' ? options.archive.algo : null,
    fileCount: files.length,
    processingTime: Math.round(processingTime * 100) / 100, // Round to 2 decimal places
    timestamp: new Date().toISOString(),
    filename: files.length === 1 ? files[0].name : `archive-${Date.now()}`,
    options: {
      compressionLevel: options.compression.level,
      compressInside: options.archive && typeof options.archive === 'object' ? options.archive.compressInside : undefined
    },
    // Enhanced metadata for optimal decompression
    files: fileDetails,
    checksums,
    compressionDetails: {
      algorithm: options.compression.algo,
      level: options.compression.level || 6
    },
    archiveDetails: options.archive && typeof options.archive === 'object' ? {
      algorithm: options.archive.algo,
      compressInside: options.archive.compressInside || false,
      structure: {
        type: files.length > 1 ? 'flat' : 'single',
        depth: 1
      }
    } : undefined,
    compatibility: {
      minVersion: '1.0.0',
      wasmModules: [
        `compression-${options.compression.algo}`,
        ...(options.archive && typeof options.archive === 'object' ? [`archive-${options.archive.algo}`] : [])
      ],
      supportedFormats: [
        options.compression.algo,
        ...(options.archive && typeof options.archive === 'object' ? [options.archive.algo] : [])
      ]
    }
  };
  
  return { data, meta };
}

// Enhanced restore function that uses embedded metadata
export async function restore(
  blob: Uint8Array,
  options: { compression: CompressionAlgo; archive?: ArchiveAlgo | false }
): Promise<FileTuple[]> {
  if (!blob || blob.length === 0) {
    throw new Error('Input blob cannot be empty');
  }
  
  if (!options || !options.compression) {
    throw new Error('Compression algorithm is required for restoration');
  }
  
  // Validate compression algorithm
  if (!(await registry.isCompressionAlgorithmSupported(options.compression))) {
    throw new Error(`Unsupported compression algorithm: ${options.compression}`);
  }
  
  // Validate archive algorithm if provided
  if (options.archive) {
    if (!(await registry.isArchiveFormatSupported(options.archive))) {
      throw new Error(`Unsupported archive algorithm: ${options.archive}`);
    }
  }

  if (!options.archive) {
    // Single file - try to extract metadata and restore original filename
    const result = await decompressWithMetadata(blob, options.compression);
    return [{
      name: result.originalName || 'file',
      data: result.data
    }];
  }
  
  // For archives, the data is already uncompressed (just packed)
  // Use enhanced unpacker to get metadata and files
  const { files, metadata } = await unpackWithMetadata(blob, options.archive);
  
  // If we have metadata, use it to restore proper filenames
  if (metadata && metadata.files) {
    return files.map((file, index) => {
      // Find corresponding metadata for this file
      const fileMeta = metadata.files[index];
      if (fileMeta && fileMeta.originalName) {
        return {
          name: fileMeta.originalName,
          data: file.data
        };
      }
      return file;
    });
  }
  
  return files;
}

/** Server-side preload (e.g. call once on boot). */
export async function preloadOnServer() {
  // preload the common defaults; cache lives in globalThis
  await Promise.all([
    getCompressor('gzip'),
    getCompressor('brotli'),
    getArchiver('zip'),
  ]);
}

// 🔥 NEW: Export file extension utilities
export {
  generateFileExtension,
  parseFileExtension,
  generateSmartFilename,
  validateFilenameConvention,
  getSupportedExtensions
};

// 🔥 NEW: Export types for external use
export type {
  CompressionAlgo,
  ArchiveAlgo,
  ProcessOptions,
  ProcessMetadata
} from './utils/types';

// 🏗️ Main SDK Class
export class DroplySDK {
  constructor() {
    // Initialize SDK
  }

  /**
   * Process files with compression and optional archiving
   */
  async processFiles(
    files: FileTuple[],
    options: ProcessOptions
  ): Promise<Uint8Array> {
    return processFiles(files, options);
  }

  /**
   * Process files with metadata
   */
  async processFilesMeta(
    files: FileTuple[],
    options: ProcessOptions
  ): Promise<{ data: Uint8Array; meta: ProcessMetadata }> {
    return processFilesMeta(files, options);
  }

  /**
   * Restore files from compressed data
   */
  async restore(
    blob: Uint8Array,
    options: { compression: CompressionAlgo; archive?: ArchiveAlgo | false }
  ): Promise<FileTuple[]> {
    return restore(blob, options);
  }

  /**
   * Preload common modules
   */
  async preload(): Promise<void> {
    return preloadOnServer();
  }
}

// 🌟 Default SDK instance
export const droply = new DroplySDK();
