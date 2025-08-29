// types/compression.ts - Compression algorithm types
// 🎯 Single responsibility: Define compression-related types

export type CompressionAlgo = 'gzip' | 'brotli' | 'zip' | 'none';

export interface CompressionConfig {
  algo: CompressionAlgo;
  level: number;
}

export interface CompressionResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  algorithm: CompressionAlgo;
  level: number;
}

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
