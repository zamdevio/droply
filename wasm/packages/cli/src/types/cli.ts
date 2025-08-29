// types/cli.ts - Core CLI type definitions
// 🎯 Single responsibility: Define CLI option types

export interface CliOptions {
  command: 'compress' | 'decompress' | 'info';
  files: string[];
  algo?: 'gzip' | 'brotli' | 'zip' | 'none';
  archive?: 'zip' | 'tar' | 'none';
  level?: number;
  compressInside?: boolean;
  mode?: 'each' | 'bundle' | 'error';
  output?: string;
  outputDir?: string;
  meta?: boolean;
  metaFormat?: 'text' | 'json';
  metaPath?: string;
  metaName?: string;
  noMeta?: boolean;
  allowUserMeta?: boolean;
  debug?: boolean;
  verbose?: boolean;
}

export interface CliContext {
  logger: any;
  startTime: number;
}

export interface CommandResult {
  success: boolean;
  outputPath?: string;
  metadata?: any;
  error?: string;
}
