// utils/archiver.ts
import { Registry } from '../registry';
import { DefaultModuleLoader } from '../registry/loader';
import type { ArchiveAlgo, IArchiver, CompressionAlgo, ProcessMetadata } from './types';
import { getCompressor } from './compressor';

export const METADATA_FILENAME = '.__droply_meta.json';

export async function getArchiver(algo: ArchiveAlgo): Promise<IArchiver> {
  try {
    // Use the new registry system
    const registry = new Registry();
    
    // Check if algorithm is supported
    if (!(await registry.isArchiveFormatSupported(algo))) {
      throw new Error(`Unsupported archive algorithm: ${algo}`);
    }
    
    // Get the current platform
    const platform = await registry.getCurrentPlatform();
    
    // Use the module loader to get the actual plugin functions
    const moduleLoader = new DefaultModuleLoader();
    const pluginModule = await moduleLoader.loadArchivePlugin(platform, algo);
    
    if (!pluginModule) {
      throw new Error(`Failed to load archive plugin: ${algo} for platform ${platform}`);
    }
    
    // The plugin module contains the actual functions, not just metadata
    // TypeScript doesn't know the exact shape, so we use any for the loaded module
    const loadedModule = pluginModule as any;
    
    // The plugin should export pack/unpack functions
    const packFn = loadedModule.pack || loadedModule.default?.pack;
    const unpackFn = loadedModule.unpack || loadedModule.default?.unpack;
    
    if (typeof packFn !== 'function' || typeof unpackFn !== 'function') {
      throw new Error(`Bad exports for ${algo} plugin`);
    }

    // Wrap into uniform IArchiver
    const adapter: IArchiver = {
      async pack(files, options) {
        return packFn(files, options);
      },
      async unpack(archive) {
        return unpackFn(archive);
      },
    };
    return adapter;
  } catch (e) {
    throw new Error(`Failed to load ${algo} archiver: ${e}`);
  }
}

// ===== NEW SEPARATE METADATA SYSTEM =====
// This replaces the old embedded metadata approach to prevent file corruption

export interface EnhancedArchiveOptions {
  compressInside?: boolean;
  compression?: {
    algo: CompressionAlgo;
    level?: number;
  };
}

/**
 * Create a separate metadata file alongside the compressed file
 * This approach preserves file integrity and makes metadata easily accessible
 */
export async function createMetadataFile(
  metadata: ProcessMetadata,
  outputPath: string,
  fs: any // File system interface (Node.js fs or browser equivalent)
): Promise<string | null> {
  try {
    // Create metadata filename: .filename.droply_meta.json
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/') + 1);
    const baseName = outputPath.substring(outputPath.lastIndexOf('/') + 1);
    const metadataPath = `${dir}.${baseName}.droply_meta.json`;
    
    // Enhanced metadata with additional context
    const enhancedMetadata = {
      ...metadata,
      _droply: {
        version: '1.0.0',
        sdk: '@droply/sdk',
        timestamp: new Date().toISOString(),
        checksum: await generateChecksum(metadata),
        compatibility: {
          minVersion: '1.0.0',
          wasmModules: (metadata as any).wasmModules || [],
          supportedFormats: (metadata as any).supportedFormats || []
        }
      }
    };
    
    const metadataJson = JSON.stringify(enhancedMetadata, null, 2);
    
    if (typeof window !== 'undefined') {
      // Browser environment - create downloadable file
      const blob = new Blob([metadataJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `.${baseName}.droply_meta.json`;
      a.click();
      URL.revokeObjectURL(url);
      return `.${baseName}.droply_meta.json`;
    } else {
      // Node.js environment - write to filesystem
      await fs.promises.writeFile(metadataPath, metadataJson, 'utf8');
      return metadataPath;
    }
  } catch (error) {
    console.warn('Failed to create metadata file:', error);
    return null;
  }
}

/**
 * Read metadata from a separate metadata file
 */
export async function readMetadataFile(
  filePath: string,
  fs: any // File system interface
): Promise<ProcessMetadata | null> {
  try {
    const dir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
    const baseName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const metadataPath = `${dir}.${baseName}.droply_meta.json`;
    
    if (typeof window !== 'undefined') {
      // Browser environment - would need user to select file
      return null;
    } else {
      // Node.js environment - read from filesystem
      const metadataContent = await fs.promises.readFile(metadataPath, 'utf8');
      return JSON.parse(metadataContent);
    }
  } catch (error) {
    return null;
  }
}

/**
 * Check if a metadata file exists for a given file
 */
export async function hasMetadataFile(
  filePath: string,
  fs: any
): Promise<boolean> {
  try {
    const dir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
    const baseName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const metadataPath = `${dir}.${baseName}.droply_meta.json`;
    
    if (typeof window !== 'undefined') {
      return false; // Browser can't check file existence
    } else {
      await fs.promises.access(metadataPath);
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Delete a metadata file for a given file
 */
export async function deleteMetadataFile(
  filePath: string,
  fs: any
): Promise<boolean> {
  try {
    const dir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
    const baseName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const metadataPath = `${dir}.${baseName}.droply_meta.json`;
    
    if (typeof window !== 'undefined') {
      return false; // Browser can't delete files
    } else {
      await fs.promises.unlink(metadataPath);
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Generate a simple checksum for metadata validation
 */
async function generateChecksum(metadata: ProcessMetadata): Promise<string> {
  const metadataStr = JSON.stringify(metadata);
  const encoder = new TextEncoder();
  const data = encoder.encode(metadataStr);
  
  // Simple hash for now - could be enhanced with crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Pack files with embedded metadata for optimal restoration
 */
export async function packWithMetadata(
  files: { name: string; data: Uint8Array }[],
  archiveAlgo: ArchiveAlgo,
  metadata: ProcessMetadata,
  options: EnhancedArchiveOptions = {}
): Promise<Uint8Array> {
  const archiver = await getArchiver(archiveAlgo);
  
  // Create metadata file content
  const metadataContent = JSON.stringify(metadata, null, 2);
  const metadataFile = {
    name: METADATA_FILENAME,
    data: new TextEncoder().encode(metadataContent)
  };
  
  // Add metadata file to the beginning of the file list
  const filesWithMetadata = [metadataFile, ...files];
  
  // Pack with the enhanced archiver
  return archiver.pack(filesWithMetadata, { 
    compressInside: options.compressInside || false 
  });
}

/**
 * Unpack files and extract embedded metadata for optimal restoration
 */
export async function unpackWithMetadata(
  archiveData: Uint8Array,
  archiveAlgo: ArchiveAlgo
): Promise<{ files: { name: string; data: Uint8Array }[]; metadata: ProcessMetadata | null }> {
  const archiver = await getArchiver(archiveAlgo);
  const allFiles = await archiver.unpack(archiveData);
  
  // Look for metadata file
  const metadataFile = allFiles.find(f => f.name === METADATA_FILENAME);
  let metadata: ProcessMetadata | null = null;
  let actualFiles: { name: string; data: Uint8Array }[] = [];
  
  if (metadataFile) {
    try {
      // Parse metadata
      const metadataText = new TextDecoder().decode(metadataFile.data);
      metadata = JSON.parse(metadataText);
      
      // Filter out metadata file from actual files
      actualFiles = allFiles.filter(f => f.name !== METADATA_FILENAME);
      
      // Restore original filenames if we have metadata
      if (metadata?.files && metadata.files.length > 0) {
        actualFiles = actualFiles.map((file, index) => {
          const fileMeta = metadata!.files[index];
          if (fileMeta && fileMeta.name) {
            return {
              name: fileMeta.name,
              data: file.data
            };
          }
          return file;
        });
      }
    } catch (error) {
      console.warn('Failed to parse embedded metadata, falling back to archive contents');
      actualFiles = allFiles.filter(f => f.name !== METADATA_FILENAME);
    }
  } else {
    // No metadata, return all files as-is
    actualFiles = allFiles;
  }
  
  return { files: actualFiles, metadata };
}

/**
 * Compress single file with embedded metadata in gzip comment
 */
export async function compressWithMetadata(
  file: { name: string; data: Uint8Array },
  compressionAlgo: CompressionAlgo,
  metadata: ProcessMetadata,
  options: { level?: number } = {}
): Promise<Uint8Array> {
  const compressor = await getCompressor(compressionAlgo);
  
  if (compressionAlgo === 'gzip') {
    // For gzip, we'll embed metadata in a custom way
    // Since we can't modify the gzip header without breaking compatibility,
    // we'll prepend metadata as a special format that our decompressor can detect
    const metadataHeader = createMetadataHeader(metadata);
    const combinedData = new Uint8Array(metadataHeader.length + file.data.length);
    combinedData.set(metadataHeader, 0);
    combinedData.set(file.data, metadataHeader.length);
    
    return compressor.compress(combinedData, { level: options.level });
  } else {
    // For other algorithms, just compress normally
    return compressor.compress(file.data, { level: options.level });
  }
}

/**
 * Decompress single file and extract embedded metadata
 */
export async function decompressWithMetadata(
  compressedData: Uint8Array,
  compressionAlgo: CompressionAlgo
): Promise<{ data: Uint8Array; metadata: ProcessMetadata | null; originalName?: string }> {
  const compressor = await getCompressor(compressionAlgo);
  const decompressed = await compressor.decompress(compressedData);
  
  if (compressionAlgo === 'gzip') {
    // Check if our metadata header is present
    const metadataInfo = extractMetadataFromHeader(decompressed);
    if (metadataInfo) {
      return {
        data: metadataInfo.data,
        metadata: metadataInfo.metadata,
        originalName: metadataInfo.metadata.filename
      };
    }
  }
  
  // No metadata found, return decompressed data as-is
  return { data: decompressed, metadata: null };
}

/**
 * Create a metadata header that can be prepended to file data
 */
function createMetadataHeader(metadata: ProcessMetadata): Uint8Array {
  // Create a special header that our decompressor can detect
  // Format: __DROPLY_META__ + length + JSON data
  const metadataJson = JSON.stringify(metadata);
  const metadataBytes = new TextEncoder().encode(metadataJson);
  
  const header = new TextEncoder().encode('__DROPLY_META__');
  const lengthBytes = new Uint8Array(4);
  new DataView(lengthBytes.buffer).setUint32(0, metadataBytes.length, false);
  
  const headerData = new Uint8Array(header.length + 4 + metadataBytes.length);
  headerData.set(header, 0);
  headerData.set(lengthBytes, header.length);
  headerData.set(metadataBytes, header.length + 4);
  
  return headerData;
}

/**
 * Extract metadata from the special header format
 */
function extractMetadataFromHeader(data: Uint8Array): { data: Uint8Array; metadata: ProcessMetadata } | null {
  const headerMarker = new TextEncoder().encode('__DROPLY_META__');
  
  // Check if our header is present
  if (data.length < headerMarker.length + 4) {
    return null;
  }
  
  // Check header marker
  for (let i = 0; i < headerMarker.length; i++) {
    if (data[i] !== headerMarker[i]) {
      return null;
    }
  }
  
  try {
    // Extract metadata length
    const lengthBytes = data.slice(headerMarker.length, headerMarker.length + 4);
    const metadataLength = new DataView(lengthBytes.buffer).getUint32(0, false);
    
    // Extract metadata JSON
    const metadataStart = headerMarker.length + 4;
    const metadataEnd = metadataStart + metadataLength;
    
    if (metadataEnd > data.length) {
      return null;
    }
    
    const metadataBytes = data.slice(metadataStart, metadataEnd);
    const metadataText = new TextDecoder().decode(metadataBytes);
    const metadata = JSON.parse(metadataText);
    
    // Return actual file data (everything after metadata)
    const fileData = data.slice(metadataEnd);
    
    return { data: fileData, metadata };
  } catch (error) {
    return null;
  }
}


