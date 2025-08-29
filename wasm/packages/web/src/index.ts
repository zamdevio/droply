// Import everything from the SDK (like CLI does)
import { 
  DroplySDK, 
  compress as sdkCompress,
  decompress as sdkDecompress,
  createArchive as sdkCreateArchive,
  extractArchive as sdkExtractArchive,
  listArchive as sdkListArchive,
  type FileTuple,
  type CompressionAlgo,
  type ArchiveAlgo,
  type ProcessOptions,
  type ProcessMetadata
} from '@droply/sdk';

// Create and export the main SDK instance
export const droply = new DroplySDK();

// Re-export types from SDK
export type {
  FileTuple,
  CompressionAlgo,
  ArchiveAlgo,
  ProcessOptions,
  ProcessMetadata
};

// Export individual functions for convenience (these come from SDK)
export const compress = sdkCompress;
export const decompress = sdkDecompress;
export const createArchive = sdkCreateArchive;
export const extractArchive = sdkExtractArchive;
export const listArchive = sdkListArchive;

// Export SDK instance methods for algorithms and file extensions
export const getSupportedAlgorithms = () => droply.getSupportedAlgorithms();
export const getFileExtensions = () => droply.getFileExtensions();

// Web-specific utility functions (ONLY web-specific stuff)
export function getDeviceRecommendations() {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isLowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;

  return {
    compressionLevel: isLowEnd ? 6 : 9,
    batchSize: isMobile ? 10 : 20,
    useWebWorkers: !isLowEnd,
    memoryOptimization: isMobile || isLowEnd
  };
}

export function getOptimizedProcessingOptions() {
  const recommendations = getDeviceRecommendations();
  
  return {
    compression: {
      level: recommendations.compressionLevel,
      batchSize: recommendations.batchSize,
      useWorkers: recommendations.useWebWorkers
    },
    archiving: {
      batchSize: Math.floor(recommendations.batchSize / 2),
      memoryLimit: recommendations.memoryOptimization ? '256MB' : '1GB'
    }
  };
}

export async function getBatteryStatus() {
  if (typeof navigator !== 'undefined' && typeof (navigator as any).getBattery === 'function') {
    try {
      return await (navigator as any).getBattery();
    } catch {
      return null;
    }
  }
  return null;
}

export function getBrowserMetrics() {
  if (typeof performance !== 'undefined') {
    return {
      timing: {
        navigationStart: performance.timing?.navigationStart || 0,
        loadEventEnd: performance.timing?.loadEventEnd || 0,
        domContentLoaded: performance.timing?.domContentLoadedEventEnd || 0
      },
      hardwareConcurrency: navigator.hardwareConcurrency || 1
    };
  }
  
  return {
    timing: { navigationStart: 0, loadEventEnd: 0, domContentLoaded: 0 },
    hardwareConcurrency: 1
  };
}

export async function processFilesStreaming(
  files: Array<{ name: string; data: Uint8Array }>,
  options: { algorithm: string; level?: number } = { algorithm: 'gzip', level: 6 }
) {
  const recommendations = getDeviceRecommendations();
  const batchSize = recommendations.batchSize;
  
  const results = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          // Use the SDK's compress function directly
          const compressed = await sdkCompress(file.data, options.algorithm as CompressionAlgo, options.level);
          return {
            name: file.name,
            originalSize: file.data.length,
            compressedSize: compressed.length,
            compressionRatio: ((1 - compressed.length / file.data.length) * 100).toFixed(1)
          };
        } catch (error) {
          return {
            name: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    results.push(...batchResults);
  }
  
  return {
    data: new Uint8Array(0), // Placeholder for actual compressed data
    metadata: { batchIndex: 0 },
    results
  };
}

// Export the main droply instance as default
export default droply;
