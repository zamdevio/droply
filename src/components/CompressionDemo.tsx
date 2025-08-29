'use client';

import { useState, useCallback } from 'react';
import { uploadWithCompression, downloadWithDecompression } from '@/lib/client/api';
import { getCompressionRecommendation } from '@/lib/utils/compression';

interface UploadResult {
  fileId: string;
  isCompressed: boolean;
  compressionAlgo: string | null;
  originalSize: number | null;
  compressionRatio: number | null;
  size: number;
  originalName: string;
}

export default function CompressionDemo() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<any>(null);
  const [downloadMode, setDownloadMode] = useState<'client' | 'server' | 'raw'>('client');
  const [downloadPassword, setDownloadPassword] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
    
    if (selectedFiles.length > 0) {
      // Get compression recommendation
      const recommendation = getCompressionRecommendation(selectedFiles);
      setCompressionInfo(recommendation);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const result = await uploadWithCompression(files, {
        expiresIn: '7d',
        compression: { algorithm: 'zip' }
      });
      
      if (result.success && result.data) {
        setUploadResult({
          fileId: result.data.fileId,
          isCompressed: result.data.isCompressed,
          compressionAlgo: result.data.compressionAlgo,
          originalSize: result.data.originalSize,
          compressionRatio: result.data.compressionRatio,
          size: result.data.size,
          originalName: result.data.originalName
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [files]);

  const handleDownload = useCallback(async () => {
    if (!uploadResult?.fileId || !downloadPassword) return;
    
    setDownloading(true);
    try {
      const result = await downloadWithDecompression(uploadResult.fileId, downloadPassword, {
        mode: downloadMode
      });
      
      if (result.success) {
        console.log('Download successful:', result);
        alert(`Download authorized! Mode: ${downloadMode}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Check console for details.');
    } finally {
      setDownloading(false);
    }
  }, [uploadResult?.fileId, downloadPassword, downloadMode]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🔥 Droply Compression Pipeline Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Experience the god-tier compression pipeline in action!
        </p>
      </div>

      {/* File Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">📁 File Selection</h2>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Selected Files:</h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-mono text-sm">{file.name}</span>
                  <span className="text-gray-500">{formatBytes(file.size)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Compression Analysis */}
      {compressionInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">🧠 Compression Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {compressionInfo.shouldCompress ? '🔥' : 'ℹ️'}
              </div>
              <div className="text-sm font-semibold">Recommendation</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {compressionInfo.shouldCompress ? 'Compress' : 'Skip'}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {compressionInfo.algorithm.toUpperCase()}
              </div>
              <div className="text-sm font-semibold">Algorithm</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Best choice</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                💡
              </div>
              <div className="text-sm font-semibold">Reason</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {compressionInfo.reason}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">📤 Upload with Compression</h2>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {uploading ? '🔥 Compressing & Uploading...' : '🚀 Upload with Compression Pipeline'}
        </button>
        
        {uploadResult && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ Upload Successful!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">File ID:</span> {uploadResult.fileId}
              </div>
              <div>
                <span className="font-semibold">Name:</span> {uploadResult.originalName}
              </div>
              <div>
                <span className="font-semibold">Size:</span> {formatBytes(uploadResult.size)}
              </div>
              <div>
                <span className="font-semibold">Compressed:</span> {uploadResult.isCompressed ? 'Yes' : 'No'}
              </div>
              {uploadResult.isCompressed && (
                <>
                  <div>
                    <span className="font-semibold">Algorithm:</span> {uploadResult.compressionAlgo}
                  </div>
                  <div>
                    <span className="font-semibold">Original Size:</span> {uploadResult.originalSize ? formatBytes(uploadResult.originalSize) : 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Compression Ratio:</span> {uploadResult.compressionRatio ? `${(uploadResult.compressionRatio * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Download Section */}
      {uploadResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">⬇️ Download with Decompression</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Password:</label>
              <input
                type="password"
                value={downloadPassword}
                onChange={(e) => setDownloadPassword(e.target.value)}
                placeholder="Enter file password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Decompression Mode:</label>
              <select
                value={downloadMode}
                onChange={(e) => setDownloadMode(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="client">🔥 Client-side (Default)</option>
                <option value="server">🔄 Server-side</option>
                <option value="raw">📦 Raw (Compressed)</option>
              </select>
            </div>
            
            <button
              onClick={handleDownload}
              disabled={!downloadPassword || downloading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {downloading ? '⬇️ Downloading...' : '⬇️ Download with Decompression'}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Decompression Modes:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li><strong>Client-side:</strong> Download compressed file + metadata, decompress in browser</li>
              <li><strong>Server-side:</strong> Server decompresses and sends individual files</li>
              <li><strong>Raw:</strong> Download compressed file as-is (no decompression)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">🚀 Compression Pipeline Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">🔥 Client-Side Compression</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• WASM-powered compression in the browser</li>
              <li>• Smart file type detection</li>
              <li>• Automatic algorithm selection</li>
              <li>• Fallback to TypeScript if WASM fails</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3">🔄 Backend Awareness</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Validates client compression metadata</li>
              <li>• Server-side compression fallback</li>
              <li>• Full compression tracking</li>
              <li>• Performance optimization</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3">⚡ Flexible Download</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Choose decompression mode per request</li>
              <li>• Single file extraction from archives</li>
              <li>• Compression ratio tracking</li>
              <li>• Full metadata visibility</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3">🎯 Developer Experience</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Simple API functions</li>
              <li>• TypeScript support</li>
              <li>• Comprehensive error handling</li>
              <li>• Performance monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
