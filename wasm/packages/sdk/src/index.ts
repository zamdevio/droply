// 🚀 Droply SDK - Unified API for Node.js and Web
// Automatically detects platform and uses appropriate WASM modules

import { getCompressor } from './utils/compressor';
import { getArchiver } from './utils/archiver';
import type { CompressionAlgo, ArchiveAlgo, ProcessOptions, ProcessMetadata } from './utils/types.ts';
import { Registry } from './registry';
import { DefaultModuleLoader } from './registry/loader';
import { 
  generateFileExtension, 
  parseFileExtension, 
  generateSmartFilename, 
  validateFilenameConvention,
  getSupportedExtensions 
} from './utils/extensions';

// Import the actual function implementations from the old index
import {
  processFiles,
  processFilesMeta,
  restore,
  preloadOnServer
} from './index-old';

// Platform detection
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isWeb = typeof window !== 'undefined' && typeof WebAssembly !== 'undefined';

// Platform-specific WASM module paths
const WASM_PATHS = {
  node: './wasm/packages/plugins/build-node',
  web: './wasm/packages/plugins/build'
};

// File tuple type
export type FileTuple = { name: string; data: Uint8Array };

// 🚀 Additional utility functions - NO DEFAULT PARAMETERS
async function compress(data: Uint8Array, algo: CompressionAlgo, level?: number): Promise<Uint8Array> {
  if (!data || data.length === 0) {
    throw new Error('Data cannot be empty');
  }
  if (!algo) {
    throw new Error('Compression algorithm is required');
  }
  
  // Check if algorithm is supported using registry
  const registry = new Registry();
  if (!(await registry.isCompressionAlgorithmSupported(algo))) {
    throw new Error(`Unsupported compression algorithm: ${algo}`);
  }
  
  const compressor = await getCompressor(algo);
  return compressor.compress(data, { level });
}

async function decompress(data: Uint8Array, algo: CompressionAlgo): Promise<Uint8Array> {
  if (!data || data.length === 0) {
    throw new Error('Data cannot be empty');
  }
  if (!algo) {
    throw new Error('Compression algorithm is required');
  }
  
  // Check if algorithm is supported using registry
  const registry = new Registry();
  if (!(await registry.isCompressionAlgorithmSupported(algo))) {
    throw new Error(`Unsupported compression algorithm: ${algo}`);
  }
  
  const compressor = await getCompressor(algo);
  return compressor.decompress(data);
}

async function createArchive(files: FileTuple[], algo: ArchiveAlgo, options?: { compressInside?: boolean }): Promise<Uint8Array> {
  if (!files || files.length === 0) {
    throw new Error('At least one file is required');
  }
  if (!algo) {
    throw new Error('Archive algorithm is required');
  }
  
  // Check if archive format is supported using registry
  const registry = new Registry();
  if (!(await registry.isArchiveFormatSupported(algo))) {
    throw new Error(`Unsupported archive algorithm: ${algo}`);
  }
  
  const archiver = await getArchiver(algo);
  return archiver.pack(files, options);
}

async function extractArchive(data: Uint8Array, algo: ArchiveAlgo): Promise<FileTuple[]> {
  if (!data || data.length === 0) {
    throw new Error('Archive data cannot be empty');
  }
  if (!algo) {
    throw new Error('Archive algorithm is required');
  }
  
  // Check if archive format is supported using registry
  const registry = new Registry();
  if (!(await registry.isArchiveFormatSupported(algo))) {
    throw new Error(`Unsupported archive algorithm: ${algo}`);
  }
  
  const archiver = await getArchiver(algo);
  const result = await archiver.unpack(data);
  return result;
}

async function listArchive(data: Uint8Array, algo: ArchiveAlgo): Promise<{ name: string; size: number; compressed: boolean }[]> {
  if (!data || data.length === 0) {
    throw new Error('Archive data cannot be empty');
  }
  if (!algo) {
    throw new Error('Archive algorithm is required');
  }
  
  // Check if archive format is supported using registry
  const registry = new Registry();
  if (!(await registry.isArchiveFormatSupported(algo))) {
    throw new Error(`Unsupported archive algorithm: ${algo}`);
  }
  
  // Since the archiver interface doesn't have a list method, we need to extract and analyze
  // This is a workaround - ideally the archiver should support listing without full extraction
  try {
    const archiver = await getArchiver(algo);
    const files = await archiver.unpack(data);
    
    // Return file information without the actual data
    return files.map((file) => ({
      name: file.name,
      size: file.data.length,
      compressed: false // We can't determine this without metadata, assume false for now
    }));
  } catch (error) {
    throw new Error(`Failed to list archive contents: ${error}`);
  }
}

// 🏗️ Main SDK Class with Platform Detection
export class DroplySDK {
  private platform: 'node' | 'web';
  private initialized: boolean = false;
  private wasmModules: Map<string, any> = new Map();

  constructor() {
    this.platform = isNode ? 'node' : isWeb ? 'web' : 'web'; // Default to web
    this.validatePlatform();
  }

  /**
   * Validate platform support
   */
  private validatePlatform(): void {
    if (!isNode && !isWeb) {
      throw new Error('Droply SDK requires either Node.js or a WebAssembly-capable browser');
    }
    
    if (this.platform === 'node' && !isNode) {
      throw new Error('Node.js environment required for Node.js SDK');
    }
    
    if (this.platform === 'web' && !isWeb) {
      throw new Error('WebAssembly support required for Web SDK');
    }
  }

  /**
   * Initialize SDK and preload common modules
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Preload common modules based on platform
      await this.preloadCommonModules();
      this.initialized = true;
      // SDK initialized successfully
    } catch (error) {
      throw new Error(`Failed to initialize Droply SDK: ${error}`);
    }
  }

  /**
   * Preload common WASM modules
   */
  private async preloadCommonModules(): Promise<void> {
    const modules = [
      { type: 'compression', algo: 'gzip' },
      { type: 'compression', algo: 'brotli' },
      { type: 'archive', algo: 'zip' }
    ];

    for (const module of modules) {
      try {
        if (module.type === 'compression') {
          await getCompressor(module.algo as CompressionAlgo);
        } else if (module.type === 'archive') {
          await getArchiver(module.algo as ArchiveAlgo);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to preload ${module.type} module ${module.algo}:`, error);
      }
    }
  }

  /**
   * Get platform information
   */
  getPlatform(): { type: 'node' | 'web'; wasmPath: string } {
    return {
      type: this.platform,
      wasmPath: WASM_PATHS[this.platform]
    };
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Process files with compression and optional archiving
   */
  async processFiles(
    files: FileTuple[],
    options: ProcessOptions
  ): Promise<Uint8Array> {
    await this.ensureInitialized();
    return processFiles(files, options);
  }

  /**
   * Process files with metadata
   */
  async processFilesMeta(
    files: FileTuple[],
    options: ProcessOptions
  ): Promise<{ data: Uint8Array; meta: ProcessMetadata }> {
    await this.ensureInitialized();
    return processFilesMeta(files, options);
  }

  /**
   * Restore files from compressed data
   */
  async restore(
    blob: Uint8Array,
    options: { compression: CompressionAlgo; archive?: ArchiveAlgo | false }
  ): Promise<FileTuple[]> {
    await this.ensureInitialized();
    return restore(blob, options);
  }

  /**
   * Compress single file
   */
  async compress(
    data: Uint8Array,
    algo: CompressionAlgo,
    level?: number
  ): Promise<Uint8Array> {
    await this.ensureInitialized();
    return compress(data, algo, level);
  }

  /**
   * Decompress single file
   */
  async decompress(
    data: Uint8Array,
    algo: CompressionAlgo
  ): Promise<Uint8Array> {
    await this.ensureInitialized();
    return decompress(data, algo);
  }

  /**
   * Create archive from multiple files
   */
  async createArchive(
    files: FileTuple[],
    algo: ArchiveAlgo,
    options?: { compressInside?: boolean }
  ): Promise<Uint8Array> {
    await this.ensureInitialized();
    return createArchive(files, algo, options);
  }

  /**
   * Extract archive to files
   */
  async extractArchive(
    data: Uint8Array,
    algo: ArchiveAlgo
  ): Promise<FileTuple[]> {
    await this.ensureInitialized();
    return extractArchive(data, algo);
  }

  /**
   * List archive contents
   */
  async listArchive(
    data: Uint8Array,
    algo: ArchiveAlgo
  ): Promise<{ name: string; size: number; compressed: boolean }[]> {
    await this.ensureInitialized();
    return listArchive(data, algo);
  }

  /**
   * Get supported algorithms
   */
  async getSupportedAlgorithms(): Promise<{ compression: CompressionAlgo[]; archive: ArchiveAlgo[] }> {
    await this.ensureInitialized();
    const registry = new Registry();
    return {
      compression: await registry.getSupportedCompressionAlgorithms() as CompressionAlgo[],
      archive: await registry.getSupportedArchiveFormats() as ArchiveAlgo[]
    };
  }

  /**
   * Get file extension utilities
   */
  getFileExtensions() {
    return {
      generate: generateFileExtension,
      parse: parseFileExtension,
      generateSmart: generateSmartFilename,
      validate: validateFilenameConvention,
      getSupported: getSupportedExtensions
    };
  }

  /**
   * Ensure SDK is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// 🌟 Default SDK instance
export const droply = new DroplySDK();

// 🚀 Auto-initialize for immediate use
if (typeof window !== 'undefined') {
  // Browser: auto-initialize
  droply.initialize().catch(console.warn);
} else if (typeof process !== 'undefined') {
  // Node.js: auto-initialize
  droply.initialize().catch(console.warn);
}

// 📦 Export all utility functions for direct use
export {
  // Core functions
  processFiles,
  processFilesMeta,
  restore,
  compress,
  decompress,
  createArchive,
  extractArchive,
  listArchive,
  
  // File extension utilities
  generateFileExtension,
  parseFileExtension,
  generateSmartFilename,
  validateFilenameConvention,
  getSupportedExtensions,
  
  // Preload function
  preloadOnServer
};

// 🔧 Export types
export type {
  CompressionAlgo,
  ArchiveAlgo,
  ProcessOptions,
  ProcessMetadata
};

// 🎯 Export registry functionality
export { Registry } from './registry';

// Create instances for external use
const registry = new Registry();
const moduleLoader = new DefaultModuleLoader();

// Export the instances
export { registry, moduleLoader };