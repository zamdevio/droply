import { join, dirname, basename, extname } from 'path';
import { existsSync } from 'fs';

/**
 * Generate a numbered filename with smart extension handling
 * Example: build.tar.gz -> build(1).tar.gz (not build.tar(1).gz)
 * Handles complex filenames like: file.er.se.text -> file(1).er.se.text
 */
export function generateNumberedFilename(
  originalPath: string, 
  options: NamingOptions = {}
): string {
  const {
    separator = '(',
    startNumber = 1,
    maxAttempts = 100
  } = options;

  const dir = dirname(originalPath);
  const filename = basename(originalPath);
  
  // Smart approach: Find the first meaningful dot to separate base from extensions
  // This handles cases like: file.er.se.text -> file(1).er.se.text
  // Instead of trying to guess which dot is the "extension separator"
  
  // Strategy: Look for common extension patterns first
  const commonExtensions = ['.tar.gz', '.tar.br', '.zip.gz', '.zip.br', '.gz', '.br', '.zip', '.tar'];
  let baseName = filename;
  let extensions = '';
  
  // Try to find a known extension pattern
  for (const ext of commonExtensions) {
    if (filename.endsWith(ext)) {
      baseName = filename.substring(0, filename.length - ext.length);
      extensions = ext;
      break;
    }
  }
  
  // If no known extension found, use the first dot as separator
  if (!extensions) {
    const firstDotIndex = filename.indexOf('.');
    if (firstDotIndex === -1) {
      // No dots at all, just add number
      baseName = filename;
      extensions = '';
    } else {
      // Use first dot as separator: file.er.se.text -> file(1).er.se.text
      baseName = filename.substring(0, firstDotIndex);
      extensions = filename.substring(firstDotIndex);
    }
  }
  
  // Generate numbered filename
  let counter = startNumber;
  let numberedPath = originalPath;
  
  while (existsSync(numberedPath) && counter <= maxAttempts) {
    if (extensions) {
      numberedPath = join(dir, `${baseName}${separator}${counter})${extensions}`);
    } else {
      numberedPath = join(dir, `${baseName}${separator}${counter})`);
    }
    counter++;
  }
  
  return numberedPath;
}

/**
 * Parse a numbered filename to extract the base name and number
 * Example: build(1).tar.gz -> { baseName: "build", number: 1, extensions: ".tar.gz" }
 */
export function parseNumberedFilename(filename: string): {
  baseName: string;
  number?: number;
  extensions: string;
} {
  // Look for pattern like "name(number).ext"
  const match = filename.match(/^(.+?)\((\d+)\)(.*)$/);
  
  if (match) {
    return {
      baseName: match[1],
      number: parseInt(match[2], 10),
      extensions: match[3]
    };
  }
  
  // No number found, return as-is
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return {
      baseName: filename,
      extensions: ''
    };
  }
  
  return {
    baseName: filename.substring(0, lastDotIndex),
    extensions: filename.substring(lastDotIndex)
  };
}

/**
 * Find the next available number for a filename
 */
export function findNextAvailableNumber(
  basePath: string,
  options: NamingOptions = {}
): number {
  const {
    separator = '(',
    startNumber = 1,
    maxAttempts = 100
  } = options;

  const dir = dirname(basePath);
  const filename = basename(basePath);
  
  // Use the same smart logic as generateNumberedFilename
  const commonExtensions = ['.tar.gz', '.tar.br', '.zip.gz', '.zip.br', '.gz', '.br', '.zip', '.tar'];
  let baseName = filename;
  let extensions = '';
  
  // Try to find a known extension pattern
  for (const ext of commonExtensions) {
    if (filename.endsWith(ext)) {
      baseName = filename.substring(0, filename.length - ext.length);
      extensions = ext;
      break;
    }
  }
  
  // If no known extension found, use the first dot as separator
  if (!extensions) {
    const firstDotIndex = filename.indexOf('.');
    if (firstDotIndex === -1) {
      baseName = filename;
      extensions = '';
    } else {
      baseName = filename.substring(0, firstDotIndex);
      extensions = filename.substring(firstDotIndex);
    }
  }
  
  // Find next available number
  let counter = startNumber;
  while (counter <= maxAttempts) {
    let testPath: string;
    if (extensions) {
      testPath = join(dir, `${baseName}${separator}${counter})${extensions}`);
    } else {
      testPath = join(dir, `${baseName}${separator}${counter})`);
    }
    
    if (!existsSync(testPath)) {
      return counter;
    }
    counter++;
  }
  
  return counter;
}
