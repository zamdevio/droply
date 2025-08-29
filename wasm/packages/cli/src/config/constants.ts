// config/constants.ts - Application constants
// 🎯 Single responsibility: Centralize all constants and static content

export const ERROR_MESSAGES = {
  INVALID_ALGORITHM: (algo: string) => `"${algo}" is not a supported compression algorithm`,
  INVALID_ARCHIVE: (archive: string) => `"${archive}" is not a supported archive format`,
  INVALID_LEVEL: (level: number, min: number, max: number) => `Compression level must be between ${min} and ${max}`,
  FILE_NOT_FOUND: (file: string) => `File not found: ${file}`,
  DIRECTORY_NOT_FOUND: (dir: string) => `Directory not found: ${dir}`,
  INVALID_COMMAND: (command: string) => `Unknown command: ${command}`,
  MISSING_FILES: () => 'No files specified for compression',
  MISSING_COMPRESSED_FILE: () => 'No compressed file specified for decompression',
  INVALID_OUTPUT_DIR: (dir: string) => `Cannot create output directory: ${dir}`,
  PROCESSING_FAILED: (operation: string) => `${operation} failed during processing`,
  UNSUPPORTED_OPERATION: (operation: string) => `${operation} is not supported in this context`
} as const;

export const HELP_SUGGESTIONS = {
  ALGORITHM: '💡 Supported algorithms: gzip, brotli, zip, none',
  ARCHIVE: '💡 Supported archives: zip, tar, none',
  GENERAL: '💡 Use --help to see all options',
  DEBUG: '💡 Use --debug for detailed error information'
} as const;

export const CLI_INFO = {
  name: 'droply',
  description: '🚀 Droply Enterprise CLI - Professional Compression & Archive Tool',
  version: '0.2.0'
} as const;
