// types/index.ts - Main types export
// 🎯 Single responsibility: Export all types from one place

export * from './cli';
export * from './compression';
export * from './archive';

// Re-export common types that might be used across modules
export interface ProcessOptions {
  compression: import('./compression').CompressionConfig;
  archive?: import('./archive').ArchiveConfig | false;
}

export interface ProcessResult {
  data: Uint8Array;
  metadata: any;
  processingTime: number;
}
