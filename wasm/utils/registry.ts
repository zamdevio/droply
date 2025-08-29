// utils/registry.ts
import type { ModuleDescriptor, CompressionAlgo, ArchiveAlgo } from './types';

const base = './build'; // relative path for Node.js compatibility

export const CompressionRegistry: Record<CompressionAlgo, ModuleDescriptor> = {
  gzip:   { kind: 'bindgen', wasmPath: `${base}/compression/gzip/module_bg.wasm`, jsInitPath: `${base}/compression/gzip/module.js` },
  brotli: { kind: 'bindgen', wasmPath: `${base}/compression/brotli/module_bg.wasm`, jsInitPath: `${base}/compression/brotli/module.js` },
  zip:    { kind: 'bindgen', wasmPath: `${base}/compression/zip/module_bg.wasm`, jsInitPath: `${base}/compression/zip/module.js` },
};

export const ArchiveRegistry: Record<ArchiveAlgo, ModuleDescriptor> = {
  zip: { kind: 'bindgen', wasmPath: `${base}/archive/zip/module_bg.wasm`, jsInitPath: `${base}/archive/zip/module.js` },
  tar: { kind: 'bindgen', wasmPath: `${base}/archive/tar/module_bg.wasm`, jsInitPath: `${base}/archive/tar/module.js` },
};

// 🚀 Dynamic algorithm discovery - automatically derived from registry
export const SUPPORTED_COMPRESSION: CompressionAlgo[] = Object.keys(CompressionRegistry) as CompressionAlgo[];
export const SUPPORTED_ARCHIVES: ArchiveAlgo[] = Object.keys(ArchiveRegistry) as ArchiveAlgo[];

// 🎯 Utility function to get all supported algorithms
export function getAllSupportedAlgorithms() {
  return {
    compression: SUPPORTED_COMPRESSION,
    archives: SUPPORTED_ARCHIVES,
    all: [...SUPPORTED_COMPRESSION, ...SUPPORTED_ARCHIVES] as (CompressionAlgo | ArchiveAlgo)[]
  };
}

// 🔍 Utility functions to check algorithm support
export function isCompressionSupported(algo: string): algo is CompressionAlgo {
  return SUPPORTED_COMPRESSION.includes(algo as CompressionAlgo);
}

export function isArchiveSupported(algo: string): algo is ArchiveAlgo {
  return SUPPORTED_ARCHIVES.includes(algo as ArchiveAlgo);
}

export function isAlgorithmSupported(algo: string): algo is CompressionAlgo | ArchiveAlgo {
  return isCompressionSupported(algo) || isArchiveSupported(algo);
}
