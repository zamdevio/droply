import { existsSync, statSync, unlinkSync, rmdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { generateNumberedFilename, findNextAvailableNumber } from './naming';
import { promptConflictResolution } from './prompt';
import type { ConflictResolution, ConflictOptions, FileConflict } from './types';

/**
 * Handle file conflicts with interactive user input
 * Returns the final path to use for the file
 */
export async function handleFileConflict(
  outputPath: string, 
  log: any,
  options: ConflictOptions = {}
): Promise<string> {
  if (!existsSync(outputPath)) {
    return outputPath; // No conflict, use original path
  }

  const {
    allowReplace = true,
    allowSkip = true,
    allowKeepBoth = true,
    defaultAction = 'keep-both',
    autoResolve = false
  } = options;

  // If auto-resolve is enabled, use default action
  if (autoResolve) {
    return handleAutoResolve(outputPath, defaultAction, log);
  }

  // Generate numbered filename for "keep both" option
  const numberedPath = generateNumberedFilename(outputPath);
  
  // Show conflict information
  const stats = statSync(outputPath);
  log.warn(`⚠️  File already exists: ${basename(outputPath)}`);
  log.info(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
  log.info(`📅 Modified: ${stats.mtime.toLocaleString()}`);
  
  // Get user choice
  try {
    const choice = await promptConflictResolution(
      outputPath,
      'file',
      numberedPath,
      { defaultChoice: 'k' }
    );
    
    switch (choice) {
      case 'replace':
        if (!allowReplace) {
          log.warn('⚠️  Replace not allowed, falling back to keep both');
          return numberedPath;
        }
        log.info('🗑️  Replacing existing file...');
        unlinkSync(outputPath);
        return outputPath;
        
      case 'skip':
        if (!allowSkip) {
          log.warn('⚠️  Skip not allowed, falling back to keep both');
          return numberedPath;
        }
        log.info('⏭️  Skipping file creation');
        throw new Error('FILE_SKIPPED');
        
      case 'keep-both':
        if (!allowKeepBoth) {
          log.warn('⚠️  Keep both not allowed, falling back to replace');
          unlinkSync(outputPath);
          return outputPath;
        }
        log.info(`💾 Creating numbered version: ${basename(numberedPath)}`);
        return numberedPath;
        
      default:
        log.warn('⚠️  Invalid choice, falling back to keep both');
        return numberedPath;
    }
  } catch (error) {
    if (error.message === 'FILE_SKIPPED') {
      throw error;
    }
    log.warn('⚠️  Interactive input failed, falling back to auto-resolve');
    return handleAutoResolve(outputPath, defaultAction, log);
  }
}

/**
 * Handle directory conflicts - simplified to focus only on files
 * Returns the final directory path to use
 */
export async function handleDirectoryConflict(
  outputDir: string,
  log: any,
  options: ConflictOptions = {}
): Promise<string> {
  if (!existsSync(outputDir)) {
    return outputDir; // No conflict, use original path
  }

  const stats = statSync(outputDir);
  
  if (stats.isFile()) {
    // Path conflicts with existing file - create numbered directory
    log.warn(`⚠️  Output directory path conflicts with existing file: ${outputDir}`);
    log.info(`💡 Creating numbered directory: ${basename(outputDir)}(1)`);
    
    const numberedDir = generateNumberedFilename(outputDir);
    return numberedDir;
  } else {
    // It's already a directory, no conflict
    log.debug(`Directory already exists: ${outputDir}`);
    return outputDir;
  }
}

/**
 * Handle auto-resolution when interactive input is not available
 */
function handleAutoResolve(
  path: string, 
  action: string, 
  log: any
): string {
  switch (action) {
    case 'replace':
      log.info(`🔄 Auto-replacing existing file...`);
      unlinkSync(path);
      return path;
      
    case 'skip':
      log.info(`⏭️  Auto-skipping file creation...`);
      throw new Error('FILE_SKIPPED');
      
    case 'keep-both':
    default:
      const numberedPath = generateNumberedFilename(path);
      log.info(`💾 Auto-creating numbered version: ${basename(numberedPath)}`);
      return numberedPath;
  }
}

/**
 * Analyze a file conflict to provide detailed information
 */
export function analyzeFileConflict(path: string): FileConflict | null {
  if (!existsSync(path)) {
    return null;
  }
  
  try {
    const stats = statSync(path);
    return {
      originalPath: path,
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      modified: stats.mtime
    };
  } catch (error) {
    return null;
  }
}
