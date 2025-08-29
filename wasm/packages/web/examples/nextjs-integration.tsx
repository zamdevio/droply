// Next.js Integration Example for @droply/web
// This shows how to use the package in a Next.js application

'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import @droply/web to avoid SSR issues
const DroplyWeb = dynamic(() => import('@droply/web'), {
  ssr: false,
  loading: () => <div>Loading WASM modules...</div>
});

// Types for our component
interface FileData {
  name: string;
  size: number;
  data: Uint8Array;
}

interface CompressionResult {
  algorithm: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  time: number;
}

interface ArchiveResult {
  format: string;
  fileCount: number;
  totalSize: number;
  archiveSize: number;
  ratio: number;
  time: number;
}

export default function DroplyWebDemo() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([]);
  const [archiveResults, setArchiveResults] = useState<ArchiveResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const filePromises = Array.from(selectedFiles).map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      return {
        name: file.name,
        size: file.size,
        data: new Uint8Array(arrayBuffer)
      };
    });

    Promise.all(filePromises).then(setFiles);
  }, []);

  // Test compression algorithms
  const testCompression = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const { compress, getDeviceRecommendations } = await import('@droply/web');
      
      // Get device recommendations
      const recommendations = getDeviceRecommendations();
      setDeviceInfo(recommendations);

      const results: CompressionResult[] = [];
      const algorithms = ['gzip', 'brotli', 'zip'] as const;

      for (let i = 0; i < algorithms.length; i++) {
        const algorithm = algorithms[i];
        const file = files[0]; // Test with first file
        
        const startTime = performance.now();
        const compressed = await compress(file.data, algorithm, recommendations.compressionLevel);
        const endTime = performance.now();

        results.push({
          algorithm,
          originalSize: file.size,
          compressedSize: compressed.length,
          ratio: ((1 - compressed.length / file.size) * 100),
          time: endTime - startTime
        });

        setProgress(((i + 1) / algorithms.length) * 100);
      }

      setCompressionResults(results);
    } catch (error) {
      console.error('Compression test failed:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [files]);

  // Test archive creation
  const testArchiving = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const { createArchive, getDeviceRecommendations } = await import('@droply/web');
      
      const recommendations = getDeviceRecommendations();
      const results: ArchiveResult[] = [];
      const formats = ['zip', 'tar'] as const;

      for (let i = 0; i < formats.length; i++) {
        const format = formats[i];
        
        const startTime = performance.now();
        const archive = await createArchive(
          files.map(f => ({ name: f.name, data: f.data })),
          format,
          { compressInside: format === 'zip' }
        );
        const endTime = performance.now();

        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        
        results.push({
          format,
          fileCount: files.length,
          totalSize,
          archiveSize: archive.length,
          ratio: ((1 - archive.length / totalSize) * 100),
          time: endTime - startTime
        });

        setProgress(((i + 1) / formats.length) * 100);
      }

      setArchiveResults(results);
    } catch (error) {
      console.error('Archive test failed:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [files]);

  // Streaming file processing
  const processFilesStreaming = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const { processFilesStreaming } = await import('@droply/web');
      
      const result = await processFilesStreaming(
        files.map(f => ({ name: f.name, data: f.data })),
        { compression: { level: 6 } },
        (progress) => {
          setProgress(progress.percentage);
        }
      );

      console.log('Streaming processing completed:', result);
    } catch (error) {
      console.error('Streaming processing failed:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [files]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🌐 @droply/web Next.js Demo
        </h1>
        <p className="text-lg text-gray-600">
          High-performance compression and archiving with WebAssembly
        </p>
      </div>

      {/* File Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">📁 File Selection</h2>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {files.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              Selected {files.length} file(s):
            </p>
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li key={index} className="text-sm text-gray-700">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Device Information */}
      {deviceInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">📱 Device Recommendations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Compression Level:</span> {deviceInfo.compressionLevel}
            </div>
            <div>
              <span className="font-medium">Batch Size:</span> {deviceInfo.batchSize}
            </div>
            <div>
              <span className="font-medium">Use Web Workers:</span> {deviceInfo.useWebWorkers ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Memory Optimization:</span> {deviceInfo.memoryOptimization ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">🚀 Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={testCompression}
            disabled={files.length === 0 || isProcessing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Test Compression
          </button>
          <button
            onClick={testArchiving}
            disabled={files.length === 0 || isProcessing}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Test Archiving
          </button>
          <button
            onClick={processFilesStreaming}
            disabled={files.length === 0 || isProcessing}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-700 disabled:cursor-not-allowed"
          >
            Process with Streaming
          </button>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Processing... {progress.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Compression Results */}
      {compressionResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">📊 Compression Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Algorithm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compressed Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compression Ratio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time (ms)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {compressionResults.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.algorithm.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(result.originalSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(result.compressedSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.ratio.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.time.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Archive Results */}
      {archiveResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">📦 Archive Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archive Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compression Ratio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time (ms)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {archiveResults.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.format.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.fileCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(result.totalSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(result.archiveSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.ratio.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.time.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Performance Tips</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Use streaming for large files to avoid blocking the UI</li>
          <li>• Let the SDK auto-detect optimal settings for your device</li>
          <li>• Consider preloading WASM modules for better performance</li>
          <li>• Use appropriate compression levels based on your needs</li>
        </ul>
      </div>
    </div>
  );
}
