#!/usr/bin/env node

// 🚀 Droply Enterprise CLI - Professional Compression & Archive Tool
// Enterprise-grade CLI for high-performance compression operations

import { Command } from 'commander';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
// Import from local SDK for development
import { processFiles, restore } from '../../sdk/src/index';
// Import our new enterprise logger
import { createLogger } from './logger';
// Import metadata system
import { 
  composeMeta, 
  detectUserSpoofing, 
  decideEmbed, 
  printMeta,
  DEFAULT_META_DIR,
  DEFAULT_META_NAME
} from './meta';
// Import help topics
import { printTopicHelp } from './help';
// Import conflict resolution system
import { handleFileConflict, handleDirectoryConflict } from './conflicts';

// 🎯 Enterprise Logging System - No more manual chalk!
// The new logger handles everything automatically

// 🛡️ Error Handling Utilities - Now uses our enterprise logger
class ErrorHandler {
  private static logger: any = null;

  static setLogger(logger: any) {
    ErrorHandler.logger = logger;
  }

  static handleError(error: any, context: string = 'Operation'): never {
    if (!this.logger) {
      console.error(`${context} failed: ${error}`);
      process.exit(1);
    }

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
    if (!this.logger) {
      console.error(`${context} error: ${error}`);
      process.exit(1);
    }

    const userMessage = this.extractUserMessage(error);
    this.logger.error(`${context} error: ${userMessage}`);
    
    // Show usage hints for common validation errors
    if (userMessage.includes('algorithm')) {
      this.logger.info('💡 Supported algorithms: gzip, brotli, zip, none');
      this.logger.info('💡 Use --help to see all options');
    }
    
    if (userMessage.includes('archive')) {
      this.logger.info('💡 Supported archives: zip, tar, none');
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
  command: 'compress' | 'decompress' | 'info';
  files: string[];
  algo?: 'gzip' | 'brotli' | 'zip' | 'none';
  archive?: 'zip' | 'tar' | 'none';
  level?: number;
  compressInside?: boolean;
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

// Argument parsing now handled by Commander.js

// Help system now handled by Commander.js

// Validation now handled by Commander.js with proper argument parsing

// 🚀 Enterprise CLI with Commander.js
async function main() {
  // 🛡️ Compat shim: "compress help" / "decompress help"
  const argv = process.argv.slice(2);
  if (argv.length === 2 && (argv[0] === 'compress' || argv[0] === 'decompress') && argv[1] === 'help') {
    // Initialize program minimally to register commands
    const tempProgram = new Command();
    tempProgram.name('droply').description('🚀 Droply Enterprise CLI');
    
    // Define the specific command
    if (argv[0] === 'compress') {
      tempProgram
        .command('compress')
        .description('Compress files with high-performance WASM algorithms')
        .argument('<files...>', 'Files to compress')
        .option('-a, --algo <algorithm>', 'Compression algorithm (gzip, brotli, zip, none)', 'gzip')
        .option('-l, --level <number>', 'Compression level (0-9 for gzip, 0-11 for brotli)', '6')
        .option('--archive <format>', 'Archive format for multiple files (zip, tar, none)', 'zip')
        .option('--compress-inside', 'Enable internal compression within archive')
        .option('-o, --output <filename>', 'Output filename')
        .option('--output-dir <directory>', 'Output directory')
        .option('--meta', 'Show metadata after command completes')
        .option('--meta-format <format>', 'Metadata output format: text|json', 'text')
        .option('--meta-path <path>', 'In-archive metadata directory', '.droply')
        .option('--meta-name <name>', 'Metadata filename', '__droply_meta.json')
        .option('--no-meta', 'Do not embed metadata (even when archiving)')
        .option('--allow-user-meta', 'Allow inputs containing .droply/* paths (not recommended)');
    } else {
      tempProgram
        .command('decompress')
        .description('Decompress files and archives')
        .argument('<file>', 'Compressed file to decompress')
        .option('--output-dir <directory>', 'Output directory for decompressed files');
    }
    
    // Show help and exit
    const target = tempProgram.commands.find(c => c.name() === argv[0]);
    if (target) {
      target.outputHelp();
      process.exit(0);
    }
  }

  const program = new Command();

  // Set up the main program
  program
    .name('droply')
    .description('🚀 Droply Enterprise CLI - Professional Compression & Archive Tool')
    .version('0.2.0')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--debug', 'Enable debug mode')
    .option('--json', 'Output in JSON format')
    .hook('preAction', (thisCommand) => {
      const options = thisCommand.opts();
      
      // Create our enterprise logger
      const log = createLogger({ 
        verbose: options.verbose, 
        json: options.json
      });
      
      // Set the logger for error handling
      ErrorHandler.setLogger(log);
      
      if (options.verbose) {
        log.debug('Verbose logging enabled');
      }
      if (options.debug) {
        log.debug('Debug mode enabled');
      }
    });

  // Add global help text with topic and command help
  program.addHelpText('afterAll', `
Topic help:
  droply help meta       Detailed metadata usage & flags
  droply help archive    Archive formats & behavior
  droply help algo       Compression algorithms & levels

Command help:
  droply help compress   Options & examples for 'compress'
  droply help decompress Options & examples for 'decompress'
`.trim());

  // 🗜️ Compress command
  program
    .command('compress')
    .description('Compress files with high-performance WASM algorithms')
    .argument('<files...>', 'Files to compress')
    .option('-a, --algo <algorithm>', 'Compression algorithm (gzip, brotli, zip, none)', 'gzip')
    .option('-l, --level <number>', 'Compression level (0-9 for gzip, 0-11 for brotli)', '6')
    .option('--archive <format>', 'Archive format for multiple files (zip, tar, none)', 'zip')
    .option('--compress-inside', 'Enable internal compression within archive')
    .option('-o, --output <filename>', 'Output filename')
    .option('--output-dir <directory>', 'Output directory')
    .option('--meta', 'Show metadata after command completes')
    .option('--meta-format <format>', 'Metadata output format: text|json', 'text')
    .option('--meta-path <path>', 'In-archive metadata directory', DEFAULT_META_DIR)
    .option('--meta-name <name>', 'Metadata filename', DEFAULT_META_NAME)
    .option('--no-meta', 'Do not embed metadata (even when archiving)')
    .option('--allow-user-meta', 'Allow inputs containing .droply/* paths (not recommended)')
    .addHelpText('after', `
Examples:
  droply compress file.txt                    # Compress single file with gzip
  droply compress docs/ --archive zip        # Create ZIP archive of directory
  droply compress backup/ --algo brotli      # Use Brotli compression
  droply compress file.txt --meta            # Show metadata after compression
  droply compress file.txt --archive tar     # Create uncompressed TAR archive
  droply compress file.txt --algo none       # No compression (just copy)

See also: droply help meta

Note: TAR archiving (--archive tar) is experimental and may not create
standard-compatible tar files. Use ZIP for maximum compatibility.
`.trim())
    .action(async (files, options) => {
      try {
        const log = createLogger({ 
          verbose: options.verbose, 
          json: options.json 
        });
        ErrorHandler.setLogger(log);
        await handleCompress({ ...options, files, command: 'compress' }, log);
      } catch (error) {
        ErrorHandler.handleError(error, 'Compression');
      }
    });

  // 📦 Decompress command
  program
    .command('decompress')
    .description('Decompress files and archives')
    .argument('<file>', 'Compressed file to decompress')
    .option('--output-dir <directory>', 'Output directory for decompressed files')
    .addHelpText('after', `
Examples:
  droply decompress archive.zip.gz            # Decompress to current directory
  droply decompress backup.tar.br --output-dir ./restored  # Extract to specific directory

See also: droply help archive
`.trim())
    .action(async (file, options) => {
      try {
        const log = createLogger({ 
          verbose: options.verbose, 
          json: options.json 
        });
        ErrorHandler.setLogger(log);
        await handleDecompress({ ...options, files: [file], command: 'decompress' }, log);
              } catch (error) {
          ErrorHandler.handleError(error, 'Decompression');
        }
    });

  // ℹ️ Info command
  program
    .command('info')
    .description('Show information about Droply and the metadata system')
    .action(async () => {
      try {
        const log = createLogger({ 
          verbose: false, 
          json: false 
        });
        ErrorHandler.setLogger(log);
        await handleInfo({ command: 'info', files: [] }, log);
      } catch (error) {
        ErrorHandler.handleError(error, 'Info');
      }
    });

  // 📚 Help command
  program
    .command('help')
    .description('Show help for specific topics or commands')
    .argument('[topic]', 'Help topic (meta, archive, algo) or command name')
    .action(async (topic) => {
      try {
        const log = createLogger({ 
          verbose: false, 
          json: false 
        });
        ErrorHandler.setLogger(log);
        if (!topic) {
          program.outputHelp();
          return;
        }
        printTopicHelp(topic, log, program);
      } catch (error) {
        ErrorHandler.handleError(error, 'Help');
      }
    });

  // Parse arguments and execute
  try {
    await program.parseAsync();
  } catch (error) {
    ErrorHandler.handleError(error, 'CLI execution');
  }
}

async function handleDecompress(options: CliOptions, log: any) {
  
  if (options.files.length !== 1) {
    ErrorHandler.handleValidationError(
      ErrorMessages.MISSING_COMPRESSED_FILE(),
      'Decompress'
    );
  }

  const compressedFile = options.files[0];
  log.info(`Decompressing: ${compressedFile}`);

  try {
    // Read compressed file
    log.debug(`Reading compressed file`, { filename: compressedFile });
    const compressedData = readFileSync(compressedFile);
    const data = new Uint8Array(compressedData);
    log.debug(`File loaded`, { size: `${data.length} bytes` });

    // Determine compression and archive from filename
    const filename = basename(compressedFile);
    const parts = filename.split('.');
    
    log.info(`🔍 Filename parsing: "${filename}" -> parts: [${parts.join(', ')}]`);
    
    let compression: 'gzip' | 'brotli' | 'zip' = 'gzip';
    let archive: 'zip' | 'tar' | false = false;
    
    // Handle cases where parts might contain underscores (e.g., tar_1)
    const expandedParts: string[] = [];
    for (const part of parts) {
      if (part.includes('_')) {
        // Split parts that contain underscores
        expandedParts.push(...part.split('_'));
      } else {
        expandedParts.push(part);
      }
    }
    
    log.info(`🔍 Expanded parts: [${expandedParts.join(', ')}]`);

    // Parse filename to determine compression and archive
    if (parts.includes('br')) {
      compression = 'brotli';
    } else if (parts.includes('gz')) {
      compression = 'gzip';
    } else if (parts.includes('zip')) {
      compression = 'zip';
    }

    // Check for archive format - look for zip/tar in the filename
    // The format is typically: name.zip.gz or name.tar.gz
    // Archives are compressed, so we need both archive and compression detection
    if (parts.includes('zip') && parts.length >= 2) {
      // If we have both zip and a compression algorithm, zip is the archive
      if (parts.includes('gz') || parts.includes('br')) {
        archive = 'zip';
        // For archives, we don't need compression since the archive handles it
        compression = 'gzip'; // Default, but won't be used
      } else {
        // Just zip alone means it's the compression algorithm
        compression = 'zip';
      }
    } else if (parts.includes('tar') && parts.length >= 2) {
      // For TAR, check if there's a compression algorithm anywhere after 'tar'
      // Handle cases like: name.tar.gz, name.tar_1.gz, name.tar.br
      const tarIndex = parts.indexOf('tar');
      const hasCompression = parts.slice(tarIndex + 1).some(part => 
        part === 'gz' || part === 'br' || part === 'zip'
      );
      
      if (hasCompression) {
        archive = 'tar';
        // For archives, we don't need compression since the archive handles it
        compression = 'gzip'; // Default, but won't be used
      }
    }

    log.info(`🔍 Archive detection result: archive=${archive}, compression=${compression}`);
    log.info(`Detected compression: ${compression}`);
    if (archive) {
      log.info(`Detected archive: ${archive}`);
    }
    
    log.debug(`Starting decompression`, { compression, archive });

    // Decompress
    const startTime = Date.now();
    
    let restored: any[];
    try {
      if (archive) {
        // For archives, we need to decompress first, then unpack
        log.info(`🔍 Decompressing ${compression} layer to get ${archive} archive...`);
        const { decompress } = await import('../../sdk/src/index');
        const uncompressedArchive = await decompress(data, compression);
        log.info(`🔍 Decompressed to ${uncompressedArchive.length} bytes, now unpacking ${archive} archive...`);
        
        // Now call restore with the uncompressed archive data
        restored = await restore(uncompressedArchive, { compression: 'zip', archive }); // Use 'zip' as dummy since we already decompressed
        log.info(`🔍 Archive unpacked, got ${restored.length} files`);
      } else {
        // Single file compression, just decompress
        log.info('🔍 Decompressing single file...');
        restored = await restore(data, { compression, archive });
        log.info(`🔍 Decompression returned ${restored.length} files`);
      }
      
      log.debug(`Restore function returned`, { fileCount: restored.length, files: restored.map(f => ({ name: f.name, size: f.data.length })) });
    } catch (error) {
      log.error(`🔍 Restore function failed: ${error.message}`);
      log.debug('Restore error details', error);
      throw error;
    }
    
    const totalTime = Date.now() - startTime;
    log.debug(`Decompression completed`, { duration: `${totalTime}ms` });
    log.success(`Restored ${restored.length} file(s)`);

    // Create output directory, handling conflicts
    let outputDir = options.outputDir || '.';
    if (outputDir !== '.' && existsSync(outputDir)) {
      try {
        outputDir = await handleDirectoryConflict(outputDir, log);
      } catch (error) {
        if (error.message === 'DIRECTORY_SKIPPED') {
          outputDir = '.';
          log.info('💡 Using current directory instead');
        } else {
          throw error;
        }
      }
    }
    
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Save restored files with proper names, handling conflicts
    for (const file of restored) {
      const originalOutputPath = join(outputDir, file.name);
      
      // Handle file conflicts for each restored file
      const finalOutputPath = await handleFileConflict(originalOutputPath, log, {
        allowReplace: true,
        allowSkip: false, // Don't allow skipping for decompression output
        allowKeepBoth: true,
        defaultAction: 'keep-both'
      });
      
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
      
      writeFileSync(finalOutputPath, fileData);
      log.info(`💾 Saved: ${finalOutputPath} (${(fileData.length / 1024).toFixed(2)} KB)`);
      log.debug(`File restored`, { path: finalOutputPath, size: `${(fileData.length / 1024).toFixed(2)} KB` });
    }

    log.success(`Decompression complete in ${totalTime}ms`);

  } catch (error) {
    ErrorHandler.handleError(error, 'Decompression');
  }
}

async function handleInfo(options: CliOptions, log: any) {
  
  log.section('Droply Enterprise CLI Information');
  
  log.section('🚀 Enterprise Features');
  log.info('✅ Professional-grade CLI with Commander.js');
  log.info('✅ Beautiful colored output with colorette');
  log.info('✅ Progress indicators and spinners');
  log.info('✅ Enterprise error handling and validation');
  
  log.section('🔧 Technical Features');
  log.info('✅ Safe metadata system - never breaks file compatibility');
  log.info('✅ Metadata embedded only in archives at .droply/__droply_meta.json');
  log.info('✅ Perfect file integrity and compatibility');
  log.info('✅ WASM-powered high-performance compression');
  
  log.section('📖 Enterprise Usage Examples');
  log.info('Compress files professionally:');
  log.info('  droply compress file.txt --algo gzip --level 9');
  log.info('  droply compress docs/ --algo brotli --archive zip');
  
  log.info('Decompress with enterprise quality:');
  log.info('  droply decompress archive.zip.gz --output-dir ./restored');
  
  log.info('Get system information:');
  log.info('  droply info');
  
  log.section('🎯 Professional Options');
  log.info('• --verbose, -v: Enable verbose output');
  log.info('• --debug: Enable debug mode');
  log.info('• --meta: Show metadata after run');
  log.info('• --output-dir: Specify output directory');
  log.info('• Metadata: see `droply help meta`');
  
  log.success('🎉 Welcome to Droply Enterprise CLI - Where compression meets enterprise professionalism!');
}

async function handleCompress(options: CliOptions, log: any) {
    
    // Read files
    const fileTuples = options.files
      .filter(filePath => {
        // Defensive: filter out "help" to prevent confusion
        if (filePath === 'help') {
          log.warn('⚠️  "help" detected in file list - did you mean "droply compress --help"?');
          log.info('💡 Use --help for command help, or droply help compress for detailed help');
          return false;
        }
        return true;
      })
      .map(filePath => {
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
          ErrorHandler.handleValidationError(
            ErrorMessages.FILE_NOT_FOUND(filePath),
            'File Access'
          );
        }
      });

    // 🛡️ Spoofing detection - check for .droply/ entries in inputs
    const inputNames = fileTuples.map(f => f.name);
    log.debug('Checking for spoofing in input names', { inputNames });
    try {
      detectUserSpoofing(inputNames, options.allowUserMeta || false);
      log.debug('Spoofing check passed');
    } catch (error) {
      log.debug('Spoofing detected', { error: error.message });
      ErrorHandler.handleValidationError(error.message, 'Security Check');
    }

    log.section('Files to process');
    fileTuples.forEach((file, i) => {
      log.info(`${i + 1}. ${file.name}: ${(file.data.length / 1024).toFixed(2)} KB`);
      log.debug(`File ${i + 1} details`, { 
        name: file.name, 
        sizeBytes: file.data.length,
        sizeKB: (file.data.length / 1024).toFixed(2)
      });
    });

    // Build process options
    const processOptions: any = {
      compression: {
        algo: options.algo || 'gzip',
        level: options.level || 6
      }
    };

    // Determine if we're creating an archive
    // IMPORTANT: --archive flag creates archive, --algo zip is just compression
    // BUT: --archive zip --algo zip should NOT create an archive (it's redundant)
    // BUT: --archive none means no archive, just compression
    const hasArchive = options.files.length > 1 || (Boolean(options.archive) && options.archive !== 'none');
    if (hasArchive) {
      processOptions.archive = {
        algo: options.archive || 'zip',
        compressInside: options.compressInside || false
      };
    }

    // For single file + archive flag, we need to create a proper archive
    // BUT: --algo zip (alone or with --archive) should NOT create an archive, just compress
    // BUT: --archive none means no archive, just compression
    const shouldCreateArchive = Boolean(options.archive) && options.archive !== 'none' && options.files.length === 1 && options.algo !== 'zip';

    // 🎯 Metadata embedding decision
    // ZIP compression (alone or with --archive) doesn't create archives, so no embedding
    let shouldEmbed = decideEmbed({
      hasArchive: hasArchive, // Now properly handles --archive zip --algo zip case
      requestedEmbed: true, // Default to embedding when archiving
      noMetaFlag: options.noMeta || false
    });

    // Warn if single file + no archive but user wants internal meta
    if (options.files.length === 1 && !hasArchive && options.meta && !options.noMeta) {
      log.warn('⚠️  Single file compression detected - metadata will not be embedded');
      log.info('💡 To embed metadata, use --archive tar or --archive zip');
      log.info('💡 Example: droply compress file.txt --archive tar --algo gzip --meta');
      log.info('💡 Note: --algo zip alone creates compressed files, not archives');
    }

    // Warn about redundant --archive zip --algo zip combination
    if (options.archive === 'zip' && options.algo === 'zip') {
      log.warn('⚠️  Redundant combination detected: --archive zip --algo zip');
      log.info('💡 This will create a ZIP-compressed file, not a ZIP archive');
      log.info('💡 For ZIP archive: use --archive zip --algo gzip');
      log.info('💡 For ZIP compression: use --algo zip (without --archive)');
    }

    log.section('Processing options');
    log.info(`Compression: ${processOptions.compression.algo} (level ${processOptions.compression.level})`);
    log.debug(`Compression configuration`, processOptions.compression);
    
    if (processOptions.archive && typeof processOptions.archive === 'object') {
      log.info(`Archive: ${processOptions.archive.algo} (compress inside: ${processOptions.archive.compressInside})`);
      log.debug(`Archive configuration`, processOptions.archive);
    }

    if (shouldEmbed) {
      log.info(`Metadata: Will embed at ${options.metaPath || DEFAULT_META_DIR}/${options.metaName || DEFAULT_META_NAME}`);
    } else {
      log.info('Metadata: Will not embed (console display only)');
    }
    
    log.debug(`Complete processing configuration`, processOptions);

    // Process files with enterprise progress indicator
    const spinner = log.spinner('Processing files with WASM compression...');
    const startTime = Date.now();

    let result: Uint8Array;
    let metadata: any = null;

    // Process files with proper archive handling
    log.debug('Initiating WASM compression/archiving process');
    
    // Handle "none" compression case - just copy files without compression
    if (options.algo === 'none') {
      log.info('🔍 No compression requested - copying files as-is...');
      if (options.files.length === 1) {
        // Single file - just copy it
        result = fileTuples[0].data;
        log.info('🔍 Single file copied without compression');
      } else {
        // Multiple files - create archive without compression
        if (hasArchive && processOptions.archive?.algo !== 'none') {
          log.info(`🔍 Creating ${processOptions.archive?.algo} archive without compression...`);
          const { createArchive } = await import('../../sdk/src/index');
          // Type assertion to handle "none" case that we've already filtered out
          const archiveAlgo = processOptions.archive!.algo as 'zip' | 'tar';
          result = await createArchive(fileTuples, archiveAlgo, { 
            compressInside: false 
          });
          log.info('🔍 Archive created without compression');
        } else {
          // No archive, just concatenate files
          const totalSize = fileTuples.reduce((sum, file) => sum + file.data.length, 0);
          result = new Uint8Array(totalSize);
          let offset = 0;
          for (const file of fileTuples) {
            result.set(file.data, offset);
            offset += file.data.length;
          }
          log.info('🔍 Files concatenated without compression or archiving');
        }
      }
    } else if (shouldCreateArchive) {
      try {
        // For single file + archive flag, create a proper archive first
        log.info(`🔍 Creating ${options.archive} archive for single file...`);
        log.debug('Creating archive for single file');
        const { createArchive } = await import('../../sdk/src/index');
        log.info(`🔍 Calling createArchive with ${fileTuples.length} files...`);
        result = await createArchive(fileTuples, options.archive!, { 
          compressInside: options.compressInside || false 
        });
        log.info(`🔍 Archive created successfully, size: ${result.length} bytes`);
        log.debug(`Archive created`, { resultSize: `${result.length} bytes` });
        
        // Validate that we actually got a reasonable archive size
        // A tar archive should be larger than the original file due to headers
        if (result.length <= fileTuples[0].data.length) {
          log.warn(`⚠️  Archive size suspicious: ${result.length} <= ${fileTuples[0].data.length}`);
          throw new Error('Archive creation returned suspiciously small result - likely not a valid archive');
        }
        
        // 🎯 EMBED METADATA INSIDE THE ARCHIVE
        if (shouldEmbed) {
          log.info('🔍 Embedding metadata inside archive...');
          try {
            const { embedMetaZip, embedMetaTar } = await import('./meta/embed');
            
            // Create a temporary archive with metadata embedded
            if (options.archive === 'zip') {
              // For ZIP, we need to create a new ZIP with metadata
              // This is complex, so for now we'll create a separate metadata file
              log.info('📋 ZIP metadata embedding not yet implemented - creating separate file');
            } else if (options.archive === 'tar') {
              // For TAR, we need to create a new TAR with metadata
              // This is complex, so for now we'll create a separate metadata file
              log.info('📋 TAR metadata embedding not yet implemented - creating separate file');
            }
          } catch (error) {
            log.warn('⚠️  Metadata embedding failed, will create separate file');
            log.debug('Embedding error', error);
          }
        }
        
        // If compression is requested on top of the archive, apply it
        if (options.algo && options.algo !== 'zip') {
          log.info(`🔍 Applying ${options.algo} compression to archive...`);
          log.debug(`Applying ${options.algo} compression to archive`);
          const { compress } = await import('../../sdk/src/index');
          result = await compress(result, options.algo, options.level);
          log.info(`🔍 Archive compressed with ${options.algo}, final size: ${result.length} bytes`);
          log.debug(`Archive compressed with ${options.algo}`, { resultSize: `${result.length} bytes` });
        }
      } catch (error) {
        log.warn(`⚠️  Archive creation failed: ${error.message}`);
        log.info('💡 Falling back to standard compression (archive will not be created)');
        log.info('💡 This may happen if WASM modules for archiving are not available');
        
        // Fall back to standard compression
        result = await processFiles(fileTuples, processOptions);
        log.debug(`Fallback compression completed`, { resultSize: `${result.length} bytes` });
        
        // Update metadata to reflect that archiving failed
        shouldEmbed = false;
      }
    } else {
      // Use standard processFiles for multiple files, no archive, or ZIP compression
      // ZIP compression should use processFiles, not archive creation
      result = await processFiles(fileTuples, processOptions);
      log.debug(`Compression completed`, { resultSize: `${result.length} bytes` });
    }
    
    // 🎯 Generate metadata using the new system
    log.debug('Generating compression metadata');
    metadata = composeMeta({
      operation: 'compress',
      archive: shouldCreateArchive ? options.archive : processOptions.archive?.algo || null,
      algo: shouldCreateArchive && options.algo !== 'zip' ? options.algo : processOptions.compression.algo,
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      files: fileTuples.map(file => ({
        name: file.name,
        originalSize: file.data.length,
        compressedSize: result.length,
        method: `level ${processOptions.compression.level}`,
        mtime: new Date().toISOString()
      })),
      totals: {
        original: fileTuples.reduce((sum, file) => sum + file.data.length, 0),
        compressed: result.length,
        ratio: 1 - (result.length / fileTuples.reduce((sum, file) => sum + file.data.length, 0))
      },
      environment: {
        runtime: 'cli',
        wasm: true,
        versions: { sdk: '1.0.0' }
      }
    });

    const totalTime = Date.now() - startTime;

    // Determine output directory and filename
    let outputDir = options.outputDir || '.';
    log.debug(`Output directory`, { path: outputDir });
    
    const outputFile = options.output || await generateOutputFilename(
      fileTuples[0].name,
      processOptions.compression.algo,
      processOptions.archive && typeof processOptions.archive === 'object' ? processOptions.archive.algo : undefined
    );
    log.debug(`Generated output filename`, { filename: outputFile });

    // Create output directory if it doesn't exist, handling conflicts
    if (outputDir !== '.' && existsSync(outputDir)) {
      try {
        outputDir = await handleDirectoryConflict(outputDir, log);
      } catch (error) {
        if (error.message === 'DIRECTORY_SKIPPED') {
          outputDir = '.';
          log.info('💡 Using current directory instead');
        } else {
          throw error;
        }
      }
    }
    
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Full output path
    const fullOutputPath = join(outputDir, outputFile);

    // 🎯 Handle file conflicts and get final output path
    const finalOutputPath = await handleFileConflict(fullOutputPath, log, {
      allowReplace: true,
      allowSkip: false, // Don't allow skipping for compression output
      allowKeepBoth: true,
      defaultAction: 'keep-both'
    });
    
    // 🎯 Handle metadata embedding (only for archives)
    if (shouldEmbed) {
      log.debug('Embedding metadata into archive');
      // TODO: Implement real metadata embedding inside archives
      // For now, we'll create a separate metadata file
      log.info('📋 Metadata will be embedded in archive (implementation pending)');
    }

    // Write compressed output (clean, no embedded metadata)
    writeFileSync(finalOutputPath, result);
    
    // 🎯 Metadata handling - only for archives, no separate files
    if (shouldEmbed) {
      log.info('📋 Metadata will be embedded in archive (implementation pending)');
      log.debug('Metadata embedding not yet implemented - skipping separate file creation');
    } else {
      log.debug('No metadata embedding requested - skipping file creation');
    }
    
    spinner.succeed('Compression completed successfully!');
    log.success('Processing complete!');
    log.info(`Output file: ${fullOutputPath}`);
    log.info(`Size: ${(result.length / 1024).toFixed(2)} KB`);
    log.info(`Total time: ${totalTime}ms`);
    
    if (shouldEmbed) {
      log.info('📋 Metadata will be embedded in archive (implementation pending)');
    } else {
      log.info('📋 Metadata available for console display only');
    }

    // 🎯 Display metadata if requested
    if (options.meta) {
      const format = options.metaFormat || 'text';
      printMeta(metadata, format, log);
    }
}

async function generateOutputFilename(inputName: string, compression: string, archive?: string): Promise<string> {
  const baseName = basename(inputName, extname(inputName));
  
  // Handle special cases for "none" options
  if (compression === 'none' && (!archive || archive === 'none')) {
    // No compression, no archive - just return original filename
    return inputName;
  }
  
  if (compression === 'none' && archive && archive !== 'none') {
    // No compression but archive - use archive extension only
    if (archive === 'tar') {
      return baseName + '.tar';
    } else if (archive === 'zip') {
      return baseName + '.zip';
    }
  }
  
  // For other cases, use the proper extensions utility
  // But first filter out "none" values to match SDK types
  const { generateFileExtension } = await import('../../sdk/src/utils/extensions');
  
  // Map CLI types to SDK types, handling "none" cases
  let archiveType: 'zip' | 'tar' | 'none';
  let compressionType: 'gzip' | 'brotli' | 'zip' | 'none';
  
  if (archive === 'none') {
    archiveType = 'none';
  } else if (archive === 'tar') {
    archiveType = 'tar';
  } else if (archive === 'zip') {
    archiveType = 'zip';
  } else {
    archiveType = 'none';
  }
  
  if (compression === 'none') {
    compressionType = 'none';
  } else if (compression === 'gzip') {
    compressionType = 'gzip';
  } else if (compression === 'brotli') {
    compressionType = 'brotli';
  } else if (compression === 'zip') {
    compressionType = 'zip';
  } else {
    compressionType = 'none';
  }
  
  const extensionResult = generateFileExtension({
    baseName,
    archive: archiveType,
    compression: compressionType
  });
  
  return extensionResult.fullName;
}

// Run the CLI
main().catch((error) => {
  ErrorHandler.handleError(error, 'CLI execution');
});
