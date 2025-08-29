#!/usr/bin/env node

// 🧪 Droply WASM CLI Test Tool
// Usage: npx tsx bin/droply.ts compress ./file1.txt ./file2.txt --algo brotli --archive zip

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { processFiles, processFilesMeta, restore } from '../packages/sdk/src/index';

// 🎯 Enhanced Logging and Error Handling System
class Logger {
  private static instance: Logger;
  private debugMode: boolean = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }

  info(message: string) {
    console.log(`ℹ️  ${message}`);
  }

  success(message: string) {
    console.log(`✅ ${message}`);
  }

  warn(message: string) {
    console.log(`⚠️  ${message}`);
  }

  error(message: string, details?: any) {
    console.error(`❌ ${message}`);
    if (details && this.debugMode) {
      console.error('🔍 Debug details:', details);
    }
  }

  debug(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`🐛 ${message}`);
      if (data) {
        console.log('   Data:', data);
      }
    }
  }

  progress(message: string) {
    console.log(`🔄 ${message}`);
  }

  header(message: string) {
    console.log(`\n🚀 ${message}`);
  }

  section(message: string) {
    console.log(`\n📋 ${message}`);
  }
}

// 🛡️ Error Handling Utilities
class ErrorHandler {
  private static logger = Logger.getInstance();

  static handleError(error: any, context: string = 'Operation'): never {
    // Extract user-friendly message
    const userMessage = this.extractUserMessage(error);
    
    // Log the error
    this.logger.error(`${context} failed: ${userMessage}`);
    
    // Show helpful suggestions
    this.showHelpfulSuggestions(error, context);
    
    // Exit gracefully
    process.exit(1);
  }

  static handleValidationError(error: any, context: string = 'Validation'): never {
    const userMessage = this.extractUserMessage(error);
    this.logger.error(`${context} error: ${userMessage}`);
    
    // Show usage hints for common validation errors
    if (userMessage.includes('algorithm')) {
      this.logger.info('💡 Supported algorithms: gzip, brotli, zip');
      this.logger.info('💡 Use --help to see all options');
    }
    
    process.exit(1);
  }

  private static extractUserMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.toString) return error.toString();
    return 'Unknown error occurred';
  }

  private static showHelpfulSuggestions(error: any, context: string) {
    const message = this.extractUserMessage(error).toLowerCase();
    
    if (message.includes('algorithm') || message.includes('unsupported')) {
      this.logger.info('💡 Supported algorithms: gzip, brotli, zip');
    }
    
    if (message.includes('file') || message.includes('not found')) {
      this.logger.info('💡 Check if the file exists and path is correct');
    }
    
    if (message.includes('permission') || message.includes('access')) {
      this.logger.info('💡 Check file permissions and directory access');
    }
    
    this.logger.info('💡 Use --help for usage information');
    this.logger.info('💡 Use --debug for detailed error information');
  }
}

// 🎨 User-Friendly Error Messages
const ErrorMessages = {
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
};

interface CliOptions {
  command: 'compress' | 'decompress' | 'test';
  files: string[];
  algo?: 'gzip' | 'brotli' | 'zip';
  archive?: 'zip' | 'tar';
  level?: number;
  compressInside?: boolean;
  output?: string;
  outputDir?: string;
  meta?: boolean;
  debug?: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    command: 'compress',
    files: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === 'compress') {
      options.command = 'compress';
    } else if (arg === 'decompress') {
      options.command = 'decompress';
    } else if (arg === '--algo' && i + 1 < args.length) {
      options.algo = args[++i] as any;
    } else if (arg === '--archive' && i + 1 < args.length) {
      options.archive = args[++i] as any;
    } else if (arg === '--level' && i + 1 < args.length) {
      options.level = parseInt(args[++i]);
    } else if (arg === '--compress-inside') {
      options.compressInside = true;
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--output-dir' && i + 1 < args.length) {
      options.outputDir = args[++i];
    } else if (arg === '--meta') {
      options.meta = true;
    } else if (arg === '--debug') {
      options.debug = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      options.files.push(arg);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🧪 Droply WASM CLI Test Tool

Usage:
  npx tsx bin/droply.ts compress <files...> [options]
  npx tsx bin/droply.ts decompress <compressed-file> [options]

Commands:
  compress                    Compress and optionally archive files
  decompress                  Decompress files

Options:
  --algo <algorithm>         Compression algorithm: gzip, brotli, zip (default: gzip)
  --archive <format>         Archive format: zip, tar (default: zip for multiple files)
  --level <number>           Compression level (default: 6)
  --compress-inside          Enable internal compression within archive
  --output <filename>        Output filename (default: auto-generated)
  --output-dir <directory>   Output directory for compression/decompression (default: current directory)
  --meta                     Show detailed metadata in console
  --debug                    Enable debug mode for detailed error information
  --help, -h                 Show this help

Examples:
  # Compress single file with gzip
  npx tsx bin/droply.ts compress document.txt --algo gzip --level 9

  # Archive multiple files with brotli compression
  npx tsx bin/droply.ts compress file1.txt file2.txt --algo brotli --archive zip

  # Archive without internal compression
  npx tsx bin/droply.ts compress docs/ --algo brotli --archive zip

  # Show compression metadata
  npx tsx bin/droply.ts compress large-file.bin --algo brotli --meta

  # Decompress a file
  npx tsx bin/droply.ts decompress file.zip.br

  # Decompress to specific directory
  npx tsx bin/droply.ts decompress archive.zip.gz --output-dir ./restored

  # Compress to specific directory
  npx tsx bin/droply.ts compress file.txt --output-dir ./compressed --algo brotli
`);
}

// 🔍 Input Validation Functions
function validateOptions(options: CliOptions) {
  const logger = Logger.getInstance();
  
  // Validate command
  if (!['compress', 'decompress'].includes(options.command)) {
    ErrorHandler.handleValidationError(
      ErrorMessages.INVALID_COMMAND(options.command),
      'Command'
    );
  }

  // Validate files
  if (options.command === 'compress' && options.files.length === 0) {
    ErrorHandler.handleValidationError(
      ErrorMessages.MISSING_FILES(),
      'Files'
    );
  }

  if (options.command === 'decompress' && options.files.length !== 1) {
    ErrorHandler.handleValidationError(
      ErrorMessages.MISSING_COMPRESSED_FILE(),
      'Files'
    );
  }

  // Validate algorithm
  if (options.algo && !['gzip', 'brotli', 'zip'].includes(options.algo)) {
    ErrorHandler.handleValidationError(
      ErrorMessages.INVALID_ALGORITHM(options.algo),
      'Algorithm'
    );
  }

  // Validate archive format
  if (options.archive && !['zip', 'tar'].includes(options.archive)) {
    ErrorHandler.handleValidationError(
      ErrorMessages.INVALID_ARCHIVE(options.archive),
      'Archive'
    );
  }

  // Validate compression level
  if (options.level !== undefined) {
    const min = 0;
    const max = options.algo === 'brotli' ? 11 : 9;
    if (options.level < min || options.level > max) {
      ErrorHandler.handleValidationError(
        ErrorMessages.INVALID_LEVEL(options.level, min, max),
        'Compression Level'
      );
    }
  }

  // Validate output directory
  if (options.outputDir) {
    try {
      if (!existsSync(options.outputDir)) {
        mkdirSync(options.outputDir, { recursive: true });
      }
    } catch (error) {
      ErrorHandler.handleValidationError(
        ErrorMessages.INVALID_OUTPUT_DIR(options.outputDir),
        'Output Directory'
      );
    }
  }
}

async function main() {
  try {
    const options = parseArgs();
    const logger = Logger.getInstance();
    
    // Set debug mode if requested
    if (options.debug) {
      logger.setDebugMode(true);
      logger.debug('Debug mode enabled');
    }
    
    // Validate all options before processing
    validateOptions(options);
    
    logger.header('Droply WASM CLI Test Tool');

    if (options.command === 'decompress') {
      await handleDecompress(options);
    } else {
      await handleCompress(options);
    }

  } catch (error) {
    ErrorHandler.handleError(error, 'CLI execution');
  }
}

async function handleDecompress(options: CliOptions) {
  const logger = Logger.getInstance();
  
  if (options.files.length !== 1) {
    ErrorHandler.handleValidationError(
      ErrorMessages.MISSING_COMPRESSED_FILE(),
      'Decompress'
    );
  }

  const compressedFile = options.files[0];
  logger.progress(`Decompressing: ${compressedFile}`);

  try {
    // Read compressed file
    const compressedData = readFileSync(compressedFile);
    const data = new Uint8Array(compressedData);

    // Determine compression and archive from filename
    const filename = basename(compressedFile);
    const parts = filename.split('.');
    
    let compression: 'gzip' | 'brotli' | 'zip' = 'gzip';
    let archive: 'zip' | 'tar' | false = false;

    // Parse filename to determine compression and archive
    if (parts.includes('br')) {
      compression = 'brotli';
    } else if (parts.includes('gz')) {
      compression = 'gzip';
    } else if (parts.includes('zip')) {
      compression = 'zip';
    }

    // Check for archive format - look for zip/tar in the filename
    // The format is typically: name-timestamp.zip or name-timestamp.tar
    // Archives are NOT compressed again, so we don't need compression detection
    if (parts.includes('zip') && parts.length > 2) {
      // If we have both zip and a compression algorithm, zip is the archive
      if (parts.includes('gz') || parts.includes('br')) {
        archive = 'zip';
        // For archives, we don't need compression since the archive handles it
        compression = 'gzip'; // Default, but won't be used
      } else {
        // Just zip alone means it's the compression algorithm
        compression = 'zip';
      }
    } else if (parts.includes('tar') && parts.length > 2) {
      archive = 'tar';
      // For archives, we don't need compression since the archive handles it
      compression = 'gzip'; // Default, but won't be used
    }

    logger.info(`Detected compression: ${compression}`);
    if (archive) {
      logger.info(`Detected archive: ${archive}`);
    }

    // Decompress
    const startTime = Date.now();
    const restored = await restore(data, { compression, archive });
    const totalTime = Date.now() - startTime;

    logger.success(`Restored ${restored.length} file(s)`);

    // Create output directory
    const outputDir = options.outputDir || '.';
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Save restored files with proper names
    restored.forEach((file, index) => {
      const outputPath = join(outputDir, file.name);
      
      // Handle different data types
      let fileData: Buffer | Uint8Array;
      if (file.data instanceof Uint8Array) {
        fileData = file.data;
      } else if (Array.isArray(file.data)) {
        // Convert array to Uint8Array
        fileData = new Uint8Array(file.data);
      } else if (typeof file.data === 'number') {
        // Handle case where data might be a number
        fileData = new Uint8Array([file.data]);
      } else {
        // Fallback: try to convert to Buffer
        fileData = Buffer.from(file.data as any);
      }
      
      writeFileSync(outputPath, fileData);
      logger.info(`💾 Saved: ${outputPath} (${(fileData.length / 1024).toFixed(2)} KB)`);
    });

    logger.success(`Decompression complete in ${totalTime}ms`);

  } catch (error) {
    ErrorHandler.handleError(error, 'Decompression');
  }
}

async function handleCompress(options: CliOptions) {
    const logger = Logger.getInstance();
    
    // Read files
    const fileTuples = options.files.map(filePath => {
      try {
        if (!existsSync(filePath)) {
          ErrorHandler.handleValidationError(
            ErrorMessages.FILE_NOT_FOUND(filePath),
            'File Access'
          );
        }
        
        const data = readFileSync(filePath);
        return {
          name: basename(filePath),
          data: new Uint8Array(data)
        };
      } catch (error) {
        ErrorHandler.handleError(error, `Reading file ${filePath}`);
      }
    });

    logger.section('Files to process');
    fileTuples.forEach((file, i) => {
      logger.info(`${i + 1}. ${file.name}: ${(file.data.length / 1024).toFixed(2)} KB`);
    });

    // Build process options
    const processOptions: any = {
      compression: {
        algo: options.algo || 'gzip',
        level: options.level || 6
      }
    };

    if (options.files.length > 1) {
      processOptions.archive = {
        algo: options.archive || 'zip',
        compressInside: options.compressInside || false
      };
    }

    logger.section('Processing options');
    logger.info(`Compression: ${processOptions.compression.algo} (level ${processOptions.compression.level})`);
    if (processOptions.archive && typeof processOptions.archive === 'object') {
      logger.info(`Archive: ${processOptions.archive.algo} (compress inside: ${processOptions.archive.compressInside})`);
    }

    // Process files
    logger.progress('Processing files...');
    const startTime = Date.now();

    let result: Uint8Array;
    let metadata: any = null;

    // Always get metadata for internal use
    const resultWithMeta = await processFilesMeta(fileTuples, processOptions);
    result = resultWithMeta.data;
    metadata = resultWithMeta.meta;

    const totalTime = Date.now() - startTime;

    // Determine output directory and filename
    const outputDir = options.outputDir || '.';
    const outputFile = options.output || generateOutputFilename(
      fileTuples[0].name,
      processOptions.compression.algo,
      processOptions.archive && typeof processOptions.archive === 'object' ? processOptions.archive.algo : undefined
    );

    // Create output directory if it doesn't exist
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Full output path
    const fullOutputPath = join(outputDir, outputFile);

    // Write compressed output (metadata is now embedded inside)
    writeFileSync(fullOutputPath, result);
    
    logger.success('Processing complete!');
    logger.info(`Output file: ${fullOutputPath}`);
    logger.info(`Size: ${(result.length / 1024).toFixed(2)} KB`);
    logger.info(`Total time: ${totalTime}ms`);
    logger.info('📋 Metadata embedded inside file');

    if (options.meta) {
      logger.section('Compression Metadata');
      logger.info(`Original size: ${(metadata.originalSize / 1024).toFixed(2)} KB`);
      logger.info(`Compressed size: ${(metadata.compressedSize / 1024).toFixed(2)} KB`);
      logger.info(`Compression ratio: ${metadata.compressionRatio}%`);
      logger.info(`Processing time: ${metadata.processingTime}ms`);
      logger.info(`File count: ${metadata.fileCount}`);
      logger.info(`Timestamp: ${metadata.timestamp}`);
      
      // Enhanced metadata display
      if (metadata.compressionDetails) {
        logger.section('Compression Details');
        logger.info(`Algorithm: ${metadata.compressionDetails.algorithm}`);
        logger.info(`Level: ${metadata.compressionDetails.level}`);
      }
      
      if (metadata.archiveDetails) {
        logger.section('Archive Details');
        logger.info(`Algorithm: ${metadata.archiveDetails.algorithm}`);
        logger.info(`Compress inside: ${metadata.archiveDetails.compressInside}`);
        logger.info(`Structure: ${metadata.archiveDetails.structure.type}`);
        if (metadata.archiveDetails.structure.depth) {
          logger.info(`Structure depth: ${metadata.archiveDetails.structure.depth}`);
        }
      }
      
      if (metadata.files && metadata.files.length > 0) {
        logger.section('File Details');
        metadata.files.forEach((file: any, i: number) => {
          logger.info(`${i + 1}. ${file.name}: ${(file.originalSize / 1024).toFixed(2)} KB`);
        });
      }
      
      if (metadata.checksums) {
        logger.section('Checksums');
        logger.info(`Original: ${metadata.checksums.original}`);
        logger.info(`Compressed: ${metadata.checksums.compressed}`);
      }
      
      if (metadata.compatibility) {
        logger.section('Compatibility');
        logger.info(`Min version: ${metadata.compatibility.minVersion}`);
        logger.info(`WASM modules: ${metadata.compatibility.wasmModules.join(', ')}`);
        logger.info(`Supported formats: ${metadata.compatibility.supportedFormats.join(', ')}`);
      }
    }
}

function generateOutputFilename(inputName: string, compression: string, archive?: string): string {
  const baseName = basename(inputName, extname(inputName));
  const timestamp = Date.now();
  
  // Map compression algorithms to standard extensions
  const compressionExtensions: Record<string, string> = {
    'gzip': 'gz',
    'brotli': 'br',
    'zip': 'zip'
  };
  
  const compressionExt = compressionExtensions[compression] || compression;
  
  if (archive) {
    return `${baseName}-${timestamp}.${archive}.${compressionExt}`;
  } else {
    return `${baseName}-${timestamp}.${compressionExt}`;
  }
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    ErrorHandler.handleError(error, 'CLI execution');
  });
}
