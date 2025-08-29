// utils/file-extensions.ts
import type { ArchiveAlgo, CompressionAlgo, FileExtensionOptions, FileExtensionResult } from './types';

/**
 * 🔥 File Extension Naming Convention
 * 
 * Generates file extensions based on archive type and compression algorithm
 * following the specified naming convention:
 * 
 * | Archive | Algo   | Output extension | Example                                                          |
 * | ------: | ------ | ---------------- | ---------------------------------------------------------------- |
 * |    none | gzip   | `.gz`            | `file.txt.gz`                                                    |
 * |    none | brotli | `.br`            | `file.txt.br`                                                    |
 * |     zip | none   | `.zip`           | `bundle.zip`                                                     |
 * |     zip | zip    | `.zip`           | `bundle.zip`                                                     |
 * |     tar | none   | `.tar`           | `bundle.tar`                                                     |
 * |     tar | gzip   | `.tar.gz`        | `bundle.tar.gz`                                                  |
 * |     tar | brotli | `.tar.br`        | `bundle.tar.br`                                                  |
 * |     zip | gzip   | `.zip.gz`        | `bundle.zip.gz` (**allowed**, but only if you truly double-wrap) |
 */

export function generateFileExtension(options: FileExtensionOptions): FileExtensionResult {
  const { archive, compression, baseName } = options;
  
  // Remove any existing extensions from baseName
  const cleanBaseName = baseName.replace(/\.[^/.]+$/, '');
  
  let extension: string;
  let description: string;
  
  if (archive === 'none') {
    // Single file compression only
    switch (compression) {
      case 'gzip':
        extension = '.gz';
        description = 'Single file compressed with GZIP';
        break;
      case 'brotli':
        extension = '.br';
        description = 'Single file compressed with Brotli';
        break;
      case 'zip':
        extension = '.zip';
        description = 'Single file compressed with ZIP (deflate)';
        break;
      case 'none':
        extension = '';
        description = 'Uncompressed single file';
        break;
      default:
        throw new Error(`Unsupported compression algorithm: ${compression}`);
    }
  } else if (archive === 'zip') {
    // ZIP archive
    if (compression === 'none' || compression === 'zip') {
      extension = '.zip';
      description = 'ZIP archive (no additional compression)';
    } else if (compression === 'gzip') {
      extension = '.zip.gz';
      description = 'ZIP archive with outer GZIP compression (double-wrapped)';
    } else if (compression === 'brotli') {
      extension = '.zip.br';
      description = 'ZIP archive with outer Brotli compression (double-wrapped)';
    } else {
      throw new Error(`Unsupported compression algorithm for ZIP: ${compression}`);
    }
  } else if (archive === 'tar') {
    // TAR archive
    if (compression === 'none') {
      extension = '.tar';
      description = 'TAR archive (no compression)';
    } else if (compression === 'gzip') {
      extension = '.tar.gz';
      description = 'TAR archive compressed with GZIP';
    } else if (compression === 'brotli') {
      extension = '.tar.br';
      description = 'TAR archive compressed with Brotli';
    } else if (compression === 'zip') {
      extension = '.tar.zip';
      description = 'TAR archive compressed with ZIP (unusual but valid)';
    } else {
      throw new Error(`Unsupported compression algorithm for TAR: ${compression}`);
    }
  } else {
    throw new Error(`Unsupported archive algorithm: ${archive}`);
  }
  
  const fullName = cleanBaseName + extension;
  
  return {
    extension,
    fullName,
    description
  };
}

/**
 * 🔍 Parse file extension to determine archive and compression
 * 
 * This is the reverse operation - given a filename, determine what
 * archive and compression algorithms were used.
 */
export function parseFileExtension(filename: string): {
  baseName: string;
  archive: ArchiveAlgo | 'none';
  compression: CompressionAlgo | 'none';
  description: string;
} {
  if (!filename || filename.trim() === '') {
    throw new Error('Filename cannot be empty');
  }
  
  // Handle double extensions first (most specific)
  if (filename.endsWith('.tar.gz')) {
    return {
      baseName: filename.slice(0, -7), // Remove .tar.gz
      archive: 'tar',
      compression: 'gzip',
      description: 'TAR archive compressed with GZIP'
    };
  }
  
  if (filename.endsWith('.tar.br')) {
    return {
      baseName: filename.slice(0, -7), // Remove .tar.br
      archive: 'tar',
      compression: 'brotli',
      description: 'TAR archive compressed with Brotli'
    };
  }
  
  if (filename.endsWith('.zip.gz')) {
    return {
      baseName: filename.slice(0, -7), // Remove .zip.gz
      archive: 'zip',
      compression: 'gzip',
      description: 'ZIP archive with outer GZIP compression'
    };
  }
  
  if (filename.endsWith('.zip.br')) {
    return {
      baseName: filename.slice(0, -7), // Remove .zip.br
      archive: 'zip',
      compression: 'brotli',
      description: 'ZIP archive with outer Brotli compression'
    };
  }
  
  if (filename.endsWith('.tar.zip')) {
    return {
      baseName: filename.slice(0, -8), // Remove .tar.zip
      archive: 'tar',
      compression: 'zip',
      description: 'TAR archive compressed with ZIP'
    };
  }
  
  // Handle single extensions
  if (filename.endsWith('.gz')) {
    return {
      baseName: filename.slice(0, -3), // Remove .gz
      archive: 'none',
      compression: 'gzip',
      description: 'Single file compressed with GZIP'
    };
  }
  
  if (filename.endsWith('.br')) {
    return {
      baseName: filename.slice(0, -3), // Remove .br
      archive: 'none',
      compression: 'brotli',
      description: 'Single file compressed with Brotli'
    };
  }
  
  if (filename.endsWith('.zip')) {
    return {
      baseName: filename.slice(0, -4), // Remove .zip
      archive: 'zip',
      compression: 'none',
      description: 'ZIP archive (no additional compression)'
    };
  }
  
  if (filename.endsWith('.tar')) {
    return {
      baseName: filename.slice(0, -4), // Remove .tar
      archive: 'tar',
      compression: 'none',
      description: 'TAR archive (no compression)'
    };
  }
  
  // No recognized extension
  return {
    baseName: filename,
    archive: 'none',
    compression: 'none',
    description: 'Uncompressed file (no recognized extension)'
  };
}

/**
 * 🎯 Smart filename generation for different use cases
 */
export function generateSmartFilename(
  originalName: string,
  options: {
    archive?: ArchiveAlgo | 'none';
    compression?: CompressionAlgo | 'none';
    timestamp?: boolean;
    prefix?: string;
    suffix?: string;
  } = {}
): string {
  const {
    archive = 'none',
    compression = 'none',
    timestamp = false,
    prefix = '',
    suffix = ''
  } = options;
  
  // Remove existing extension
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  
  // Generate extension
  const { extension } = generateFileExtension({ archive, compression, baseName });
  
  // Build filename
  let filename = prefix + baseName + suffix;
  
  if (timestamp) {
    filename += `-${Date.now()}`;
  }
  
  return filename + extension;
}

/**
 * 🔄 Validate if a filename follows the naming convention
 */
export function validateFilenameConvention(filename: string): {
  valid: boolean;
  errors: string[];
  parsed?: ReturnType<typeof parseFileExtension>;
} {
  const errors: string[] = [];
  
  try {
    const parsed = parseFileExtension(filename);
    
    // Check for invalid combinations
    if (parsed.archive === 'zip' && parsed.compression === 'zip') {
      // This is actually valid - ZIP with ZIP compression
    } else if (parsed.archive === 'tar' && parsed.compression === 'zip') {
      // This is unusual but technically valid
    }
    
    return {
      valid: true,
      errors: [],
      parsed
    };
  } catch (error) {
    errors.push(`Failed to parse filename: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      valid: false,
      errors
    };
  }
}

/**
 * 📚 Get all supported file extension patterns
 */
export function getSupportedExtensions(): Array<{
  archive: ArchiveAlgo | 'none';
  compression: CompressionAlgo | 'none';
  extension: string;
  example: string;
  description: string;
}> {
  return [
    {
      archive: 'none',
      compression: 'gzip',
      extension: '.gz',
      example: 'file.txt.gz',
      description: 'Single file compressed with GZIP'
    },
    {
      archive: 'none',
      compression: 'brotli',
      extension: '.br',
      example: 'file.txt.br',
      description: 'Single file compressed with Brotli'
    },
    {
      archive: 'zip',
      compression: 'none',
      extension: '.zip',
      example: 'bundle.zip',
      description: 'ZIP archive (no additional compression)'
    },
    {
      archive: 'zip',
      compression: 'zip',
      extension: '.zip',
      example: 'bundle.zip',
      description: 'ZIP archive with ZIP compression'
    },
    {
      archive: 'tar',
      compression: 'none',
      extension: '.tar',
      example: 'bundle.tar',
      description: 'TAR archive (no compression)'
    },
    {
      archive: 'tar',
      compression: 'gzip',
      extension: '.tar.gz',
      example: 'bundle.tar.gz',
      description: 'TAR archive compressed with GZIP'
    },
    {
      archive: 'tar',
      compression: 'brotli',
      extension: '.tar.br',
      example: 'bundle.tar.br',
      description: 'TAR archive compressed with Brotli'
    },
    {
      archive: 'zip',
      compression: 'gzip',
      extension: '.zip.gz',
      example: 'bundle.zip.gz',
      description: 'ZIP archive with outer GZIP compression (double-wrapped)'
    }
  ];
}
