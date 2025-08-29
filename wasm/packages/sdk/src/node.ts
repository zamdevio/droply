// 🖥️ Droply Node SDK - Node.js Optimized
// Optimized for Node.js environments with file system support
// Uses build-node WASM modules for optimal performance

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { createHash } from 'crypto';
import { promisify } from 'util';

// Import the unified SDK class
import { DroplySDK, type FileTuple } from './index';

// 🎯 Node-specific optimizations
export class DroplyNode extends DroplySDK {
  private nodeVersion: string;
  private isProduction: boolean;

  constructor() {
    super(); // Initialize the base SDK with Node.js platform detection
    this.nodeVersion = process.version;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.initializeNodeOptimizations();
  }

  private initializeNodeOptimizations(): void {
    // Validate Node.js environment
    if (typeof process === 'undefined') {
      throw new Error('This SDK is designed for Node.js environments');
    }

    // Check Node.js version for optimal performance
    const majorVersion = parseInt(this.nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 16) {
      console.warn('⚠️ Node.js 16+ is recommended for optimal performance');
    }

    // Log platform info
    console.log(`🖥️ Droply Node SDK initialized for ${this.getPlatform().type} platform`);
    console.log(`📁 WASM modules path: ${this.getPlatform().wasmPath}`);
  }

  /**
   * 📁 Compress files from disk with Node.js optimizations
   */
  async compressFilesFromDisk(
    filePaths: string[],
    outputPath: string,
    options?: any
  ): Promise<{ outputPath: string; metadata: any; stats: any }> {
    // Validate file paths
    const validFiles = filePaths.filter(filePath => {
      if (!existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filePath}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      throw new Error('No valid files found to compress');
    }

    // Convert files to FileTuple format with Node.js optimizations
    const files: FileTuple[] = validFiles.map(filePath => {
      const stats = statSync(filePath);
      const data = readFileSync(filePath);
      
      return {
        name: basename(filePath),
        data: new Uint8Array(data)
      };
    });

    // Process files using the unified SDK
    const result = await this.processFilesMeta(files, options);
    
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Write compressed data
    writeFileSync(outputPath, result.data);
    
    // Calculate file stats
    const inputStats = validFiles.map(filePath => {
      const stats = statSync(filePath);
      return {
        path: filePath,
        size: stats.size,
        modified: stats.mtime
      };
    });

    const outputStats = statSync(outputPath);
    
    return {
      outputPath,
      metadata: result.meta,
      stats: {
        input: inputStats,
        output: {
          path: outputPath,
          size: outputStats.size,
          compressionRatio: result.meta.compressionRatio,
          processingTime: result.meta.processingTime
        }
      }
    };
  }

  /**
   * 📁 Decompress file to disk with Node.js optimizations
   */
  async decompressFileToDisk(
    compressedPath: string,
    outputDir: string,
    options?: any
  ): Promise<{ files: string[]; metadata: any; stats: any }> {
    if (!existsSync(compressedPath)) {
      throw new Error(`Compressed file not found: ${compressedPath}`);
    }

    // Read compressed data
    const compressedData = readFileSync(compressedPath);
    const compressedStats = statSync(compressedPath);
    
    // Restore files using the unified SDK
    const restored = await this.restore(new Uint8Array(compressedData), options);
    
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Write restored files
    const outputFiles: string[] = [];
    const fileStats: any[] = [];
    
    for (const file of restored) {
      const outputPath = join(outputDir, file.name);
      writeFileSync(outputPath, file.data);
      outputFiles.push(outputPath);
      
      // Get file stats
      const stats = statSync(outputPath);
      fileStats.push({
        name: file.name,
        path: outputPath,
        size: stats.size,
        restored: stats.mtime
      });
    }
    
    return {
      files: outputFiles,
      metadata: { 
        fileCount: restored.length,
        originalSize: compressedStats.size,
        restoredSize: fileStats.reduce((sum, f) => sum + f.size, 0)
      },
      stats: {
        compressed: {
          path: compressedPath,
          size: compressedStats.size,
          modified: compressedStats.mtime
        },
        restored: fileStats
      }
    };
  }

  /**
   * 🔄 Batch processing with progress tracking
   */
  async processBatchFromDisk(
    inputDir: string,
    outputDir: string,
    options?: any
  ): Promise<{ results: any[]; summary: any }> {
    if (!existsSync(inputDir)) {
      throw new Error(`Input directory not found: ${inputDir}`);
    }

    // Get all files in directory
    const { readdir, stat } = await import('fs/promises');
    const files = await readdir(inputDir);
    const filePaths = files
      .filter((file: string) => !statSync(join(inputDir, file)).isDirectory())
      .map((file: string) => join(inputDir, file));

    if (filePaths.length === 0) {
      throw new Error(`No files found in directory: ${inputDir}`);
    }

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Process files in batches
    const batchSize = options?.batchSize || 10;
    const results: any[] = [];
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResult = await this.compressFilesFromDisk(
        batch,
        join(outputDir, `batch-${Math.floor(i / batchSize)}.compressed`),
        options
      );
      results.push(batchResult);
      
      // Log progress
      const progress = Math.min(((i + batchSize) / filePaths.length) * 100, 100);
      console.log(`📊 Processing progress: ${progress.toFixed(1)}%`);
    }

    // Generate summary
    const summary = {
      totalFiles: filePaths.length,
      totalBatches: Math.ceil(filePaths.length / batchSize),
      totalInputSize: results.reduce((sum, r) => sum + r.stats.input.reduce((s: number, f: { size: number }) => s + f.size, 0), 0),
      totalOutputSize: results.reduce((sum, r) => sum + r.stats.output.size, 0),
      averageCompressionRatio: results.reduce((sum, r) => sum + r.stats.output.compressionRatio, 0) / results.length
    };

    return { results, summary };
  }

  /**
   * 📊 Get Node.js-specific performance metrics
   */
  getNodeMetrics(): {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: NodeJS.MemoryUsage;
    uptime: number;
    isProduction: boolean;
  } {
    return {
      nodeVersion: this.nodeVersion,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      isProduction: this.isProduction
    };
  }

  /**
   * 🔍 Validate file integrity with checksums
   */
  async validateFileIntegrity(filePath: string, expectedChecksum?: string): Promise<{ valid: boolean; checksum: string; details: any }> {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const data = readFileSync(filePath);
    const stats = statSync(filePath);
    
    // Generate checksums
    const md5 = createHash('md5').update(data).digest('hex');
    const sha256 = createHash('sha256').update(data).digest('hex');
    
    const checksum = expectedChecksum || md5;
    const valid = md5 === checksum || sha256 === checksum;
    
    return {
      valid,
      checksum: md5,
      details: {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        md5,
        sha256,
        expected: expectedChecksum
      }
    };
  }
}

// 🌟 Export the enhanced Node.js SDK
export default DroplyNode;
