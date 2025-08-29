// config/defaults.ts - Default configuration values
// 🎯 Single responsibility: Centralize all default values

export const DEFAULT_CONFIG = {
  compression: {
    algorithm: 'gzip' as const,
    level: 6,
  },
  archive: {
    format: 'zip' as const,
    compressInside: false,
  },
  metadata: {
    path: '.droply',
    filename: '__droply_meta.json',
    format: 'json' as const,
  },
  output: {
    directory: '.',
    createDirs: true,
  },
  validation: {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    allowedExtensions: ['.txt', '.log', '.json', '.xml', '.html', '.css', '.js', '.ts', '.py', '.sh', '.md'],
  },
} as const;

export const SUPPORTED_ALGORITHMS = ['gzip', 'brotli', 'zip', 'none'] as const;
export const SUPPORTED_ARCHIVES = ['zip', 'tar', 'none'] as const;
export const SUPPORTED_META_FORMATS = ['text', 'json'] as const;
