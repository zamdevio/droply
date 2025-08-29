// utils/types.ts
export type CompressionAlgo = 'gzip' | 'brotli' | 'zip';
export type ArchiveAlgo = 'zip' | 'tar';

export interface ICompressor {
  compress(input: Uint8Array, opts?: { level?: number }): Promise<Uint8Array>;
  decompress(input: Uint8Array): Promise<Uint8Array>;
}

export interface IArchiver {
  pack(files: { name: string; data: Uint8Array }[], opts?: Record<string, unknown>): Promise<Uint8Array>;
  unpack(archive: Uint8Array): Promise<{ name: string; data: Uint8Array }[]>;
}

/** How a WASM module is exposed. */
export type WasmModuleKind = 'raw' | 'bindgen';

/** Adapter descriptor so we can add new algos by config, not code. */
export interface ModuleDescriptor {
  kind: WasmModuleKind;
  wasmPath: string;         // e.g. '/wasm/build/compression/gzip.wasm'
  jsInitPath?: string;      // for wasm-bindgen packages (the JS glue)
  // Optional: name of exported functions if not standard
  exports?: {
    compress?: string;      // default: 'compress'
    decompress?: string;    // default: 'decompress'
    pack?: string;          // default: 'pack'
    unpack?: string;        // default: 'unpack'
  };
}

// Extended types for better validation
export interface CompressionLevels {
  gzip: { min: number; max: number; default: number };
  brotli: { min: number; max: number; default: number };
  zip: { min: number; max: number; default: number };
}

export const COMPRESSION_LEVELS: CompressionLevels = {
  gzip: { min: 0, max: 9, default: 6 },
  brotli: { min: 0, max: 11, default: 6 },
  zip: { min: 0, max: 9, default: 6 },
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FileValidationOptions {
  maxFileNameLength?: number;
  maxFileSize?: number;
  allowedExtensions?: string[];
}

// Process options for the main API
export interface ProcessOptions {
  compression: { algo: CompressionAlgo; level?: number };
  archive?: {
    algo: ArchiveAlgo;
    compressInside?: boolean; // false = no compression inside archive, true = compress individual files
  } | false; // false = no archive even for multi files
}

// 🔥 NEW: File extension naming convention
export interface FileExtensionOptions {
  archive: ArchiveAlgo | 'none';
  compression: CompressionAlgo | 'none';
  baseName: string; // Original filename without extension
}

export interface FileExtensionResult {
  extension: string;
  fullName: string;
  description: string;
}

// 🧠 Metadata for production use and analytics
export interface ProcessMetadata {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // percentage
  compression: CompressionAlgo;
  archive: ArchiveAlgo | null;
  fileCount: number;
  processingTime: number; // milliseconds
  timestamp: string; // ISO string
  filename: string;
  options: {
    compressionLevel?: number;
    compressInside?: boolean;
  };
  // Enhanced metadata for optimal decompression
  files: {
    name: string;
    originalSize: number;
    relativePath?: string; // For archived files
    originalName?: string; // Original filename for restoration
  }[];
  checksums?: {
    original: string; // Hash of original data
    compressed: string; // Hash of compressed data
  };
  compressionDetails?: {
    algorithm: CompressionAlgo;
    level: number;
    dictionary?: string; // For algorithms that support it
  };
  archiveDetails?: {
    algorithm: ArchiveAlgo;
    compressInside: boolean;
    structure: {
      type: 'flat' | 'hierarchical' | 'single';
      depth?: number;
    };
  };
  compatibility: {
    minVersion: string;
    wasmModules: string[];
    supportedFormats: string[];
  };
}
