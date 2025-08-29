// types/archive.ts - Archive format types
// 🎯 Single responsibility: Define archive-related types

export type ArchiveAlgo = 'zip' | 'tar' | 'none';

export interface ArchiveConfig {
  algo: ArchiveAlgo;
  compressInside: boolean;
}

export interface ArchiveResult {
  data: Uint8Array;
  originalSize: number;
  archiveSize: number;
  fileCount: number;
  format: ArchiveAlgo;
}

export interface FileTuple {
  name: string;
  data: Uint8Array;
}

export interface ArchiveMetadata {
  format: ArchiveAlgo;
  fileCount: number;
  totalSize: number;
  created: string;
}
