// 🌐 Droply Web SDK - Browser/Next.js Optimized
// Optimized for web browsers and Next.js with WebAssembly support
// Uses build/bundler WASM modules for optimal performance

// Import the unified SDK class
import { DroplySDK, type FileTuple } from './index';

// 🎯 Web-specific optimizations
export class DroplyWeb extends DroplySDK {
  private browserCapabilities: {
    webAssembly: boolean;
    streaming: boolean;
    simd: boolean;
    threads: boolean;
  };
  private isMobile: boolean;
  private userAgent: string;

  constructor() {
    super(); // Initialize the base SDK with Web platform detection
    this.browserCapabilities = this.detectBrowserCapabilities();
    this.isMobile = this.detectMobileDevice();
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    this.initializeWebOptimizations();
  }

  private initializeWebOptimizations(): void {
    // Validate web environment
    if (typeof window === 'undefined') {
      throw new Error('This SDK is designed for browser environments');
    }

    // Check WebAssembly support
    if (!this.browserCapabilities.webAssembly) {
      throw new Error('WebAssembly is not supported in this browser');
    }

    // Platform detection completed
  }

  /**
   * Detect browser capabilities
   */
  private detectBrowserCapabilities(): {
    webAssembly: boolean;
    streaming: boolean;
    simd: boolean;
    threads: boolean;
  } {
    return {
      webAssembly: typeof WebAssembly !== 'undefined',
      streaming: typeof WebAssembly?.instantiateStreaming === 'function',
      simd: false, // WebAssembly.simd is not widely supported yet
      threads: typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined'
    };
  }

  /**
   * Detect mobile device
   */
  private detectMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * 🌐 Load WASM modules from CDN or relative paths with streaming
   */
  async loadWasmFromUrl(url: string, options?: { streaming?: boolean; timeout?: number }): Promise<WebAssembly.Module> {
    if (typeof window === 'undefined') {
      throw new Error('This method is only available in browser environments');
    }

    const { streaming = this.browserCapabilities.streaming, timeout = 30000 } = options || {};

    try {
      // Use streaming if available and requested
      if (streaming && this.browserCapabilities.streaming) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
          }
          
          clearTimeout(timeoutId);
          return await WebAssembly.instantiateStreaming(response);
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`WASM module loading timed out after ${timeout}ms`);
          }
          throw error;
        }
      } else {
        // Fallback to traditional fetch + compile
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
        }

        const wasmBuffer = await response.arrayBuffer();
        return await WebAssembly.compile(wasmBuffer);
      }
    } catch (error) {
      throw new Error(`Failed to load WASM module from ${url}: ${error}`);
    }
  }

  /**
   * 📱 Check mobile device capabilities and optimize accordingly
   */
  getMobileOptimizations(): {
    isMobile: boolean;
    recommendedCompressionLevel: number;
    recommendedBatchSize: number;
    memoryLimit: number;
  } {
    const isMobile = this.isMobile;
    
    return {
      isMobile,
      recommendedCompressionLevel: isMobile ? 6 : 9, // Lower compression for mobile
      recommendedBatchSize: isMobile ? 5 : 20, // Smaller batches for mobile
      memoryLimit: isMobile ? 50 * 1024 * 1024 : 200 * 1024 * 1024 // 50MB vs 200MB
    };
  }

  /**
   * 🔋 Check battery status for power-aware processing
   */
  async getBatteryStatus(): Promise<{ level: number; charging: boolean; powerMode: 'low' | 'medium' | 'high' } | null> {
    if (typeof window === 'undefined') return null;
    
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        const level = battery.level;
        
        // Determine power mode based on battery level and charging status
        let powerMode: 'low' | 'medium' | 'high';
        if (battery.charging) {
          powerMode = 'high';
        } else if (level > 0.5) {
          powerMode = 'medium';
        } else {
          powerMode = 'low';
        }
        
        return {
          level,
          charging: battery.charging,
          powerMode
        };
      } catch {
        return null;
      }
    }
    
    return null;
  }

  /**
   * 📊 Get browser performance metrics and optimize processing
   */
  getBrowserMetrics(): {
    memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
    timing: { navigationStart: number; loadEventEnd: number; domContentLoaded: number };
    connection?: { effectiveType: string; downlink: number; rtt: number };
    hardwareConcurrency: number;
  } {
    if (typeof window === 'undefined') {
      return { 
        timing: { navigationStart: 0, loadEventEnd: 0, domContentLoaded: 0 },
        hardwareConcurrency: 1
      };
    }

    const metrics: any = {
      timing: {
        navigationStart: performance.timing?.navigationStart || 0,
        loadEventEnd: performance.timing?.loadEventEnd || 0,
        domContentLoaded: performance.timing?.domContentLoadedEventEnd || 0
      },
      hardwareConcurrency: navigator.hardwareConcurrency || 1
    };

    // Memory info (Chrome only)
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      metrics.memory = {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit
      };
    }

    // Network connection info
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      metrics.connection = {
        effectiveType: conn.effectiveType || 'unknown',
        downlink: conn.downlink || 0,
        rtt: conn.rtt || 0
      };
    }

    return metrics;
  }

  /**
   * 🎯 Optimize processing based on browser capabilities
   */
  async getOptimizedProcessingOptions(): Promise<{
    compressionLevel: number;
    batchSize: number;
    useStreaming: boolean;
    memoryLimit: number;
  }> {
    const mobileOpts = this.getMobileOptimizations();
    const battery = await this.getBatteryStatus();
    const metrics = this.getBrowserMetrics();
    
    // Adjust compression level based on device capabilities
    let compressionLevel = mobileOpts.recommendedCompressionLevel;
    if (battery && battery.powerMode === 'low') {
      compressionLevel = Math.min(compressionLevel, 4); // Lower compression for low battery
    }
    
    // Adjust batch size based on memory and concurrency
    let batchSize = mobileOpts.recommendedBatchSize;
    if (metrics.memory && metrics.memory.jsHeapSizeLimit > 100 * 1024 * 1024) {
      batchSize = Math.min(batchSize * 2, 50); // Increase batch size for high memory
    }
    
    return {
      compressionLevel,
      batchSize,
      useStreaming: this.browserCapabilities.streaming,
      memoryLimit: mobileOpts.memoryLimit
    };
  }

  /**
   * 🌊 Process files with streaming support for large datasets
   */
  async processFilesStreaming(
    files: FileTuple[],
    options?: any,
    onProgress?: (progress: { current: number; total: number; percentage: number }) => void
  ): Promise<{ data: Uint8Array; metadata: any }> {
    const optimizedOptions = await this.getOptimizedProcessingOptions();
    const batchSize = optimizedOptions.batchSize;
    
    if (onProgress) {
      onProgress({ current: 0, total: files.length, percentage: 0 });
    }
    
    // Process files in optimized batches
    const results: any[] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResult = await this.processFilesMeta(batch, {
        ...options,
        compression: { 
          ...options?.compression, 
          level: optimizedOptions.compressionLevel 
        }
      });
      
      results.push(batchResult);
      
      if (onProgress) {
        const current = Math.min(i + batchSize, files.length);
        const percentage = Math.round((current / files.length) * 100);
        onProgress({ current, total: files.length, percentage });
      }
      
      // Small delay to prevent blocking the main thread
      if (typeof window !== 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    // For now, return the first batch result
    // In a real implementation, you might want to combine results
    return results[0];
  }

  /**
   * 📱 Get device-specific recommendations
   */
  getDeviceRecommendations(): {
    compressionLevel: number;
    batchSize: number;
    useWebWorkers: boolean;
    memoryOptimization: boolean;
  } {
    const mobileOpts = this.getMobileOptimizations();
    const metrics = this.getBrowserMetrics();
    
    return {
      compressionLevel: mobileOpts.recommendedCompressionLevel,
      batchSize: mobileOpts.recommendedBatchSize,
      useWebWorkers: metrics.hardwareConcurrency > 1 && !this.isMobile,
      memoryOptimization: this.isMobile || (metrics.memory && metrics.memory.jsHeapSizeLimit < 100 * 1024 * 1024)
    };
  }
}

// 🌟 Export the enhanced Web SDK
export default DroplyWeb;
