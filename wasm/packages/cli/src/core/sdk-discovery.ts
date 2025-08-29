// core/sdk-discovery.ts - SDK capability discovery implementation
// 🎯 Single responsibility: Query SDK for supported algorithms and archives

import type { SdkCapabilities, SdkDiscoveryService } from '../interfaces/sdk-discovery';

export class SdkDiscovery implements SdkDiscoveryService {
  private capabilities: SdkCapabilities | null = null;
  private discoveryPromise: Promise<SdkCapabilities> | null = null;

  async getCapabilities(): Promise<SdkCapabilities> {
    // Cache the capabilities to avoid repeated SDK calls
    if (this.capabilities) {
      return this.capabilities;
    }

    // Ensure only one discovery request at a time
    if (this.discoveryPromise) {
      return this.discoveryPromise;
    }

    this.discoveryPromise = this.discoverCapabilities();
    this.capabilities = await this.discoveryPromise;
    return this.capabilities;
  }

  async validateAlgorithm(algo: string): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    return capabilities.compression.algorithms.includes(algo);
  }

  async validateArchive(archive: string): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    return capabilities.archives.formats.includes(archive);
  }

  async getCompressionLevels(algo: string): Promise<{ min: number; max: number; default: number } | null> {
    const capabilities = await this.getCapabilities();
    return capabilities.compression.levels[algo] || null;
  }

  private async discoverCapabilities(): Promise<SdkCapabilities> {
    try {
      // Use the SDK's registry ABI to discover capabilities
      const sdk = await import('../../../sdk/src/index');
      
      if (sdk.Registry && typeof sdk.Registry === 'function') {
        return this.discoverFromSDKRegistry();
      } else {
        // Fallback to old SDK discovery method
        return this.discoverFromSDK();
      }
    } catch (error) {
      console.warn('⚠️  All discovery methods failed, using fallback capabilities:', error);
      return this.getFallbackCapabilities();
    }
  }

  private async discoverFromSDKRegistry(): Promise<SdkCapabilities> {
    try {
      const sdk = await import('../../../sdk/src/index');
      const Registry = sdk.Registry;
      
      if (!Registry) {
        throw new Error('Registry not available in SDK');
      }
      
      const registry = new Registry();
      
      // Get compression algorithms and levels
      const compressionPlugins = await registry.getCompressionPlugins();
      const compressionAlgorithms = Object.keys(compressionPlugins);
      const compressionLevels: Record<string, { min: number; max: number; default: number }> = {};
      
      for (const [algo, plugin] of Object.entries(compressionPlugins)) {
        const pluginData = plugin as any; // Type assertion for now
        compressionLevels[algo] = pluginData.compression_levels;
      }
      
      // Get archive formats and features
      const archivePlugins = await registry.getArchivePlugins();
      const archiveFormats = Object.keys(archivePlugins);
      const archiveFeatures: Record<string, string[]> = {};
      
      for (const [format, plugin] of Object.entries(archivePlugins)) {
        const pluginData = plugin as any; // Type assertion for now
        archiveFeatures[format] = pluginData.features;
      }
      
      // Add 'none' options
      compressionAlgorithms.push('none');
      archiveFormats.push('none');
      compressionLevels['none'] = { min: 0, max: 0, default: 0 };
      archiveFeatures['none'] = [];
      
      return {
        compression: {
          algorithms: compressionAlgorithms,
          levels: compressionLevels
        },
        archives: {
          formats: archiveFormats,
          features: archiveFeatures
        },
        metadata: {
          supported: true,
          formats: ['text', 'json']
        }
      };
    } catch (error) {
      console.warn('⚠️  SDK registry discovery failed, falling back to old method:', error);
      return this.discoverFromSDK();
    }
  }

  private async discoverFromSDK(): Promise<SdkCapabilities> {
    // Import the SDK and query its capabilities
    const sdk = await import('../../../sdk/src/index');
    
    // Get supported algorithms from the SDK
    let compressionAlgorithms: string[] = ['gzip', 'brotli', 'zip', 'none'];
    let archiveFormats: string[] = ['zip', 'tar', 'none'];
    
    // Use the SDK's getSupportedAlgorithms method if available
    if (sdk.droply && typeof sdk.droply.getSupportedAlgorithms === 'function') {
      try {
        const supported = await sdk.droply.getSupportedAlgorithms();
        compressionAlgorithms = [...supported.compression, 'none'];
        archiveFormats = [...supported.archive, 'none'];
      } catch (error) {
        console.warn('⚠️  SDK getSupportedAlgorithms failed, using defaults:', error);
      }
    }

    // Default compression levels (can be overridden by SDK)
    const compressionLevels: Record<string, { min: number; max: number; default: number }> = {
      gzip: { min: 0, max: 9, default: 6 },
      brotli: { min: 0, max: 11, default: 6 },
      zip: { min: 0, max: 9, default: 6 },
      none: { min: 0, max: 0, default: 0 }
    };

    return {
      compression: {
        algorithms: compressionAlgorithms,
        levels: compressionLevels
      },
      archives: {
        formats: archiveFormats,
        features: {
          zip: ['compress-inside', 'metadata-embedding'],
          tar: ['metadata-embedding'],
          none: []
        }
      },
      metadata: {
        supported: true,
        formats: ['text', 'json']
      }
    };
  }

  private getFallbackCapabilities(): SdkCapabilities {
    return {
      compression: {
        algorithms: ['gzip', 'brotli', 'zip', 'none'],
        levels: {
          gzip: { min: 0, max: 9, default: 6 },
          brotli: { min: 0, max: 11, default: 6 },
          zip: { min: 0, max: 9, default: 6 },
          none: { min: 0, max: 0, default: 0 }
        }
      },
      archives: {
        formats: ['zip', 'tar', 'none'],
        features: {
          zip: ['compress-inside', 'metadata-embedding'],
          tar: ['metadata-embedding'],
          none: []
        }
      },
      metadata: {
        supported: true,
        formats: ['text', 'json']
      }
    };
  }
}
