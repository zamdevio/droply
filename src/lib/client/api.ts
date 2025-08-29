export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  status: number
  error?: string
  message?: string
}

export interface PasswordRequiredResponse {
  success: false
  error: "Password required"
  message: string
  data: {
    fileId: string
    requiresPassword: boolean
    message: string
  }
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    password?: string
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (password) {
      headers['x-file-password'] = password
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      return {
        success: data.success,
        data: data.data,
        status: response.status,
        error: data.error,
        message: data.message,
      }
    } catch (error) {
      return {
        success: false,
        status: 0,
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Failed to connect to server',
      }
    }
  }

  async get<T>(endpoint: string, password?: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, password)
  }

  async post<T>(endpoint: string, body?: any, password?: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, password)
  }

  async put<T>(endpoint: string, body?: any, password?: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }, password)
  }

  async delete<T>(endpoint: string, password?: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, password)
  }

  // Helper method to check if response requires password
  isPasswordRequired(response: ApiResponse): response is PasswordRequiredResponse {
    return response.error === 'Password required' && response.data?.requiresPassword === true
  }
}

export const apiClient = new ApiClient()

// 🔥 NEW: Compression pipeline client functions
export interface CompressionOptions {
  algorithm?: 'zip' | 'zstd' | 'brotli';
  quality?: number;
  skipAlreadyCompressed?: boolean;
}

export interface DecompressionOptions {
  mode: 'client' | 'server' | 'raw';
  extractSingle?: string;
}

/**
 * 🔥 Client-side compression before upload
 * This is the main function that implements the compression pipeline
 */
export async function compressFilesForUpload(
  files: File[], 
  options: CompressionOptions = {}
): Promise<{ 
  compressedBlob: Blob; 
  metadata: any;
  shouldUpload: boolean;
}> {
  // Import compression utilities dynamically to avoid SSR issues
  const { 
    compressFilesClient, 
    getCompressionRecommendation,
    isCompressibleFile,
    isAlreadyCompressed 
  } = await import('@/lib/utils/compression');

  // Get compression recommendation
  const recommendation = getCompressionRecommendation(files);
  
  if (!recommendation.shouldCompress) {
    console.log('ℹ️ No compression needed:', recommendation.reason);
    return {
      compressedBlob: files[0], // Return first file as-is
      metadata: {
        isCompressed: false,
        compressionAlgo: null,
        originalFiles: files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
        originalSize: files[0].size,
        compressedSize: files[0].size,
        compressionRatio: 1.0,
        clientCompressed: false
      },
      shouldUpload: true
    };
  }

  try {
    console.log('🔥 Compressing files with algorithm:', recommendation.algorithm);
    
    const result = await compressFilesClient(files, {
      ...options,
      algorithm: recommendation.algorithm
    });

    console.log('✅ Compression completed:', {
      originalSize: result.metadata.originalSize,
      compressedSize: result.metadata.compressedSize,
      ratio: result.metadata.compressionRatio
    });

    return {
      compressedBlob: result.compressedBlob,
      metadata: result.metadata,
      shouldUpload: true
    };
  } catch (error) {
    console.error('❌ Compression failed:', error);
    
    // Fall back to uncompressed upload
    return {
      compressedBlob: files[0],
      metadata: {
        isCompressed: false,
        compressionAlgo: null,
        originalFiles: files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
        originalSize: files[0].size,
        compressedSize: files[0].size,
        compressionRatio: 1.0,
        clientCompressed: false
      },
      shouldUpload: true
    };
  }
}

/**
 * 🔥 Enhanced upload with compression pipeline
 */
export async function uploadWithCompression(
  files: File[],
  options: {
    password?: string;
    expiresIn?: '1h' | '1d' | '7d' | '30d' | 'never';
    maxDownloads?: number;
    compression?: CompressionOptions;
  } = {}
): Promise<any> {
  try {
    // Step 1: Compress files if beneficial
    const compressionResult = await compressFilesForUpload(files, options.compression);
    
    // Step 2: Prepare upload data
    const formData = new FormData();
    formData.append('file', compressionResult.compressedBlob);
    formData.append('isSingleFile', (files.length === 1).toString());
    
    if (options.password) {
      formData.append('password', options.password);
    }
    
    if (options.expiresIn) {
      formData.append('expiresIn', options.expiresIn);
    }
    
    if (options.maxDownloads) {
      formData.append('maxDownloads', options.maxDownloads.toString());
    }

    // Step 3: Add compression metadata
    if (compressionResult.metadata.isCompressed) {
      formData.append('compressionMetadata', JSON.stringify(compressionResult.metadata));
      formData.append('isCompressed', 'true');
      formData.append('compressionAlgo', compressionResult.metadata.compressionAlgo || 'zip');
      formData.append('originalSize', compressionResult.metadata.originalSize.toString());
    }

    // Step 4: Add file metadata for multiple files
    if (files.length > 1) {
      formData.append('meta', JSON.stringify(compressionResult.metadata.originalFiles));
    }

    // Step 5: Perform upload
    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Upload successful with compression pipeline:', {
        fileId: result.data.fileId,
        isCompressed: result.data.isCompressed,
        compressionRatio: result.data.compressionRatio,
        originalSize: result.data.originalSize
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Upload with compression failed:', error);
    throw error;
  }
}

/**
 * 🔥 Enhanced download with decompression options
 */
export async function downloadWithDecompression(
  fileId: string,
  password: string,
  options: DecompressionOptions = { mode: 'client' }
): Promise<any> {
  try {
    const response = await fetch(`/api/v1/download/${fileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password,
        decompress: options.mode,
        extractSingle: options.extractSingle
      })
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Download authorized with decompression options:', {
        decompressionMode: result.file.decompressionMode,
        isCompressed: result.file.isCompressed,
        compressionRatio: result.file.compressionRatio
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Download with decompression failed:', error);
    throw error;
  }
}
