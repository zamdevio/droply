// 🚀 Performance testing utilities for Droply WASM system

import { processFiles, processFilesMeta } from '../index';
import type { CompressionAlgo, ArchiveAlgo, ProcessOptions } from './types';

export interface PerformanceTestResult {
  algorithm: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number;
  throughput: number; // MB/s
  memoryUsage?: number; // MB (if available)
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupRuns?: number;
  showMemory?: boolean;
  outputFormat?: 'table' | 'json' | 'csv';
}

export class PerformanceBenchmark {
  private results: PerformanceTestResult[] = [];

  /**
   * Benchmark a single compression configuration
   */
  async benchmark(
    files: { name: string; data: Uint8Array }[],
    options: ProcessOptions,
    benchmarkOpts: BenchmarkOptions = {}
  ): Promise<PerformanceTestResult> {
    const { iterations = 3, warmupRuns = 2 } = benchmarkOpts;
    
    // Warmup runs
    for (let i = 0; i < warmupRuns; i++) {
      await processFiles(files, options);
    }

    // Actual benchmark runs
    const times: number[] = [];
    const sizes: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const result = await processFilesMeta(files, options);
      const endTime = performance.now();
      
      times.push(endTime - startTime);
      sizes.push(result.data.length);
    }

    // Calculate averages
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const avgSize = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
    
    const totalOriginalSize = files.reduce((sum, f) => sum + f.data.length, 0);
    const compressionRatio = ((totalOriginalSize - avgSize) / totalOriginalSize * 100);
    const throughput = (totalOriginalSize / (1024 * 1024)) / (avgTime / 1000); // MB/s

    const result: PerformanceTestResult = {
      algorithm: this.getAlgorithmName(options),
      originalSize: totalOriginalSize,
      compressedSize: avgSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      processingTime: Math.round(avgTime * 100) / 100,
      throughput: Math.round(throughput * 100) / 100
    };

    // Add memory usage if available
    if (benchmarkOpts.showMemory && 'memory' in performance) {
      const mem = (performance as any).memory;
      if (mem && mem.usedJSHeapSize) {
        result.memoryUsage = Math.round(mem.usedJSHeapSize / (1024 * 1024) * 100) / 100;
      }
    }

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark multiple compression configurations
   */
  async benchmarkMultiple(
    files: { name: string; data: Uint8Array }[],
    configs: ProcessOptions[],
    benchmarkOpts: BenchmarkOptions = {}
  ): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = [];
    
    for (const config of configs) {
      const result = await this.benchmark(files, config, benchmarkOpts);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate a comprehensive benchmark report
   */
  generateReport(format: 'table' | 'json' | 'csv' = 'table'): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    switch (format) {
      case 'json':
        return JSON.stringify(this.results, null, 2);
      
      case 'csv':
        return this.generateCSV();
      
      case 'table':
      default:
        return this.generateTable();
    }
  }

  /**
   * Get all benchmark results
   */
  getResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Find the best performing algorithm by compression ratio
   */
  getBestCompression(): PerformanceTestResult | null {
    if (this.results.length === 0) return null;
    
    return this.results.reduce((best, current) => 
      current.compressionRatio > best.compressionRatio ? current : best
    );
  }

  /**
   * Find the fastest algorithm by throughput
   */
  getFastest(): PerformanceTestResult | null {
    if (this.results.length === 0) return null;
    
    return this.results.reduce((best, current) => 
      current.throughput > best.throughput ? current : best
    );
  }

  private getAlgorithmName(options: ProcessOptions): string {
    const parts: string[] = [];
    
    if (options.compression) {
      parts.push(`${options.compression.algo}${options.compression.level ? `-${options.compression.level}` : ''}`);
    }
    
    if (options.archive) {
      parts.push(`${options.archive.algo}${options.archive.compressInside ? '-compressed' : '-stored'}`);
    }
    
    return parts.join('+') || 'none';
  }

  private generateTable(): string {
    const headers = ['Algorithm', 'Original (KB)', 'Compressed (KB)', 'Ratio (%)', 'Time (ms)', 'Throughput (MB/s)'];
    const rows = this.results.map(r => [
      r.algorithm,
      (r.originalSize / 1024).toFixed(2),
      (r.compressedSize / 1024).toFixed(2),
      r.compressionRatio.toFixed(1),
      r.processingTime.toFixed(1),
      r.throughput.toFixed(2)
    ]);

    // Calculate column widths
    const colWidths = headers.map((header, i) => {
      const maxWidth = Math.max(
        header.length,
        ...rows.map(row => row[i].length)
      );
      return maxWidth + 2;
    });

    // Generate table
    let table = '🚀 Droply WASM Performance Benchmark Results\n\n';
    
    // Header
    table += headers.map((header, i) => header.padEnd(colWidths[i])).join('') + '\n';
    table += '-'.repeat(colWidths.reduce((sum, w) => sum + w, 0)) + '\n';
    
    // Rows
    rows.forEach(row => {
      table += row.map((cell, i) => cell.padEnd(colWidths[i])).join('') + '\n';
    });

    // Summary
    const bestCompression = this.getBestCompression();
    const fastest = this.getFastest();
    
    if (bestCompression && fastest) {
      table += '\n🏆 Summary:\n';
      table += `  Best compression: ${bestCompression.algorithm} (${bestCompression.compressionRatio}%)\n`;
      table += `  Fastest: ${fastest.algorithm} (${fastest.throughput} MB/s)\n`;
    }

    return table;
  }

  private generateCSV(): string {
    const headers = ['Algorithm', 'OriginalSize', 'CompressedSize', 'CompressionRatio', 'ProcessingTime', 'Throughput'];
    const rows = this.results.map(r => [
      r.algorithm,
      r.originalSize,
      r.compressedSize,
      r.compressionRatio,
      r.processingTime,
      r.throughput
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

/**
 * Quick benchmark utility for common use cases
 */
export async function quickBenchmark(
  files: { name: string; data: Uint8Array }[],
  benchmarkOpts: BenchmarkOptions = {}
): Promise<string> {
  const benchmark = new PerformanceBenchmark();
  
  // Test common configurations
  const configs: ProcessOptions[] = [
    { compression: { algo: 'gzip', level: 6 } },
    { compression: { algo: 'brotli', level: 6 } },
    { compression: { algo: 'zip', level: 6 } },
    { compression: { algo: 'gzip', level: 6 }, archive: { algo: 'zip', compressInside: false } },
    { compression: { algo: 'brotli', level: 6 }, archive: { algo: 'zip', compressInside: false } },
    { compression: { algo: 'gzip', level: 6 }, archive: { algo: 'tar' } }
  ];

  await benchmark.benchmarkMultiple(files, configs, benchmarkOpts);
  return benchmark.generateReport('table');
}
