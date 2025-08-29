// registry/abi.ts - SDK Registry ABI
// 🎯 Single responsibility: Provide ABI for plugin registry management

export interface CompressionPlugin {
  name: string;
  version: string;
  description: string;
  extensions: string[];
  compression_levels: {
    min: number;
    max: number;
    default: number;
  };
  paths: {
    wasm: string;
    module: string;
    types: string;
  };
}

export interface ArchivePlugin {
  name: string;
  version: string;
  description: string;
  extensions: string[];
  features: string[];
  paths: {
    wasm: string;
    module: string;
    types: string;
  };
}

export interface PlatformRegistry {
  compression: Record<string, CompressionPlugin>;
  archives: Record<string, ArchivePlugin>;
  metadata: {
    generated_at: string;
    total_plugins: number;
  };
}

export interface RegistryMetadata {
  generated_at: string;
  total_plugins: number;
}

export interface PluginRegistry {
  version: number;
  platforms: {
    nodejs: PlatformRegistry;
    bundler: PlatformRegistry;
    web: PlatformRegistry;
  };
  metadata: RegistryMetadata;
}

export interface RegistryABI {
  // Core registry access
  getRegistry(): Promise<PluginRegistry>;
  getPlatformRegistry(platform: 'nodejs' | 'bundler' | 'web'): Promise<PlatformRegistry>;
  getCompressionPlugins(platform?: 'nodejs' | 'bundler' | 'web'): Promise<Record<string, CompressionPlugin>>;
  getArchivePlugins(platform?: 'nodejs' | 'bundler' | 'web'): Promise<Record<string, ArchivePlugin>>;
  
  // Plugin discovery
  getSupportedCompressionAlgorithms(platform?: 'nodejs' | 'bundler' | 'web'): Promise<string[]>;
  getSupportedArchiveFormats(platform?: 'nodejs' | 'bundler' | 'web'): Promise<string[]>;
  
  // Plugin validation
  isCompressionAlgorithmSupported(algo: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<boolean>;
  isArchiveFormatSupported(format: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<boolean>;
  
  // Plugin details
  getCompressionPlugin(algo: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<CompressionPlugin | null>;
  getArchivePlugin(format: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<ArchivePlugin | null>;
  
  // Extension mapping (derived from plugin data)
  getCompressionAlgorithmForExtension(ext: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<string | null>;
  getArchiveFormatForExtension(ext: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<string | null>;
  
  // Registry info
  getRegistryVersion(): Promise<number>;
  getRegistryMetadata(): Promise<RegistryMetadata>;
  isRegistryValid(): Promise<boolean>;
  
  // Platform detection
  getCurrentPlatform(): Promise<'nodejs' | 'bundler' | 'web'>;
  getSupportedPlatforms(): Promise<('nodejs' | 'bundler' | 'web')[]>;
}

// Default registry implementation
export class DefaultRegistryABI implements RegistryABI {
  private registry: PluginRegistry | null = null;
  private registryPromise: Promise<PluginRegistry> | null = null;

  async getRegistry(): Promise<PluginRegistry> {
    if (this.registry) {
      return this.registry;
    }

    if (this.registryPromise) {
      return this.registryPromise;
    }

    this.registryPromise = this.loadRegistry();
    this.registry = await this.registryPromise;
    return this.registry;
  }

  async getPlatformRegistry(platform: 'nodejs' | 'bundler' | 'web'): Promise<PlatformRegistry> {
    const registry = await this.getRegistry();
    return registry.platforms[platform];
  }

  async getCompressionPlugins(platform?: 'nodejs' | 'bundler' | 'web'): Promise<Record<string, CompressionPlugin>> {
    const registry = await this.getRegistry();
    const targetPlatform = platform || await this.getCurrentPlatform();
    
    // Check if the requested platform exists
    if (!registry.platforms[targetPlatform] || !registry.platforms[targetPlatform].compression) {
      console.log(`⚠️  Platform ${targetPlatform} or its compression plugins not found in registry`);
      return {};
    }
    
    return registry.platforms[targetPlatform].compression;
  }

  async getArchivePlugins(platform?: 'nodejs' | 'bundler' | 'web'): Promise<Record<string, ArchivePlugin>> {
    const registry = await this.getRegistry();
    const targetPlatform = platform || await this.getCurrentPlatform();
    
    // Check if the requested platform exists
    if (!registry.platforms[targetPlatform] || !registry.platforms[targetPlatform].archives) {
      console.log(`⚠️  Platform ${targetPlatform} or its archive plugins not found in registry`);
      return {};
    }
    
    return registry.platforms[targetPlatform].archives;
  }

  async getSupportedCompressionAlgorithms(platform?: 'nodejs' | 'bundler' | 'web'): Promise<string[]> {
    const plugins = await this.getCompressionPlugins(platform);
    return Object.keys(plugins);
  }

  async getSupportedArchiveFormats(platform?: 'nodejs' | 'bundler' | 'web'): Promise<string[]> {
    const plugins = await this.getArchivePlugins(platform);
    return Object.keys(plugins);
  }

  async isCompressionAlgorithmSupported(algo: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<boolean> {
    const plugins = await this.getCompressionPlugins(platform);
    return algo in plugins;
  }

  async isArchiveFormatSupported(format: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<boolean> {
    const plugins = await this.getArchivePlugins(platform);
    return format in plugins;
  }

  async getCompressionPlugin(algo: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<CompressionPlugin | null> {
    const plugins = await this.getCompressionPlugins(platform);
    return plugins[algo] || null;
  }

  async getArchivePlugin(format: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<ArchivePlugin | null> {
    const plugins = await this.getArchivePlugins(platform);
    return plugins[format] || null;
  }

  async getCompressionAlgorithmForExtension(ext: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<string | null> {
    const plugins = await this.getCompressionPlugins(platform);
    
    for (const [algo, plugin] of Object.entries(plugins)) {
      if (plugin.extensions.includes(ext)) {
        return algo;
      }
    }
    
    return null;
  }

  async getArchiveFormatForExtension(ext: string, platform?: 'nodejs' | 'bundler' | 'web'): Promise<string | null> {
    const plugins = await this.getArchivePlugins(platform);
    
    for (const [format, plugin] of Object.entries(plugins)) {
      if (plugin.extensions.includes(ext)) {
        return format;
      }
    }
    
    return null;
  }

  async getRegistryVersion(): Promise<number> {
    const registry = await this.getRegistry();
    return registry.version;
  }

  async getRegistryMetadata(): Promise<RegistryMetadata> {
    const registry = await this.getRegistry();
    return registry.metadata;
  }

  async isRegistryValid(): Promise<boolean> {
    try {
      const registry = await this.getRegistry();
      return registry.version > 0 && 
             registry.metadata.total_plugins > 0 &&
             (Object.keys(registry.platforms.nodejs.compression).length > 0 || 
              Object.keys(registry.platforms.nodejs.archives).length > 0);
    } catch {
      return false;
    }
  }

  private async loadRegistry(): Promise<PluginRegistry> {
    try {
      // First, try to import from @droply/plugins (production mode)
      // This will work when the package is published and installed
      try {
        // Use dynamic import with string to avoid TypeScript compilation errors
        const registryPath = '@droply/plugins/registry';
        const registryModule = await import(registryPath);
        const registry: PluginRegistry = registryModule.default;
        
        if (this.validateRegistry(registry)) {
          console.log('✅ Successfully loaded registry from @droply/plugins/registry');
          return registry;
        }
      } catch (importError) {
        console.log('ℹ️  @droply/plugins not available, trying local paths...');
      }

      // Fallback: try to load from local paths (development mode)
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Try to find registry in common locations
      const possiblePaths = [
        './packages/plugins/registry.json',
        '../packages/plugins/registry.json',
        '../../packages/plugins/registry.json',
        './node_modules/@droply/plugins/registry.json'
      ];
      
      console.log('🔍 Trying relative paths for registry:');
      for (const registryPath of possiblePaths) {
        console.log(`  - ${registryPath}`);
        try {
          const registryData = await fs.readFile(registryPath, 'utf-8');
          const registry: PluginRegistry = JSON.parse(registryData);
          
          if (this.validateRegistry(registry)) {
            console.log(`✅ Successfully loaded registry from ${registryPath}`);
            return registry;
          }
        } catch (error) {
          console.log(`  ❌ Failed: ${error.message}`);
          continue; // Try next path
        }
      }
      
      // Try absolute paths based on current working directory
      const cwd = process.cwd();
      const absolutePaths = [
        path.join(cwd, 'packages', 'plugins', 'registry.json'),
        path.join(cwd, 'wasm', 'packages', 'plugins', 'registry.json'),
        path.join(cwd, '..', 'wasm', 'packages', 'plugins', 'registry.json')
      ];
      
      console.log('🔍 Trying absolute paths for registry:');
      for (const registryPath of absolutePaths) {
        console.log(`  - ${registryPath}`);
        try {
          const registryData = await fs.readFile(registryPath, 'utf-8');
          const registry: PluginRegistry = JSON.parse(registryData);
          
          if (this.validateRegistry(registry)) {
            console.log(`✅ Successfully loaded registry from ${registryPath}`);
            return registry;
          }
        } catch (error) {
          console.log(`  ❌ Failed: ${error.message}`);
          continue; // Try next path
        }
      }
      
      throw new Error('Could not find registry in any expected location');
    } catch (error) {
      console.warn('⚠️  Failed to load registry from @droply/plugins or local paths, using fallback:', error);
      return this.getFallbackRegistry();
    }
  }

  private validateRegistry(registry: any): registry is PluginRegistry {
    console.log('🔍 Validating registry structure:');
    console.log(`  - Has registry: ${!!registry}`);
    console.log(`  - Has version: ${!!registry?.version} (${typeof registry?.version})`);
    console.log(`  - Has platforms: ${!!registry?.platforms} (${typeof registry?.platforms})`);
    console.log(`  - Has nodejs: ${!!registry?.platforms?.nodejs} (${typeof registry?.platforms?.nodejs})`);
    console.log(`  - Has bundler: ${!!registry?.platforms?.bundler} (${typeof registry?.platforms?.bundler})`);
    console.log(`  - Has web: ${!!registry?.platforms?.web} (${typeof registry?.platforms?.web})`);
    console.log(`  - Has metadata: ${!!registry?.metadata} (${typeof registry?.metadata})`);
    console.log(`  - Has total_plugins: ${!!registry?.metadata?.total_plugins} (${typeof registry?.metadata?.total_plugins})`);
    
    // Validate that registry has the basic structure
    // Note: web platform is optional, not all registries need it
    const isValid = registry &&
           typeof registry.version === 'number' &&
           typeof registry.platforms === 'object' &&
           typeof registry.platforms.nodejs === 'object' &&
           typeof registry.platforms.bundler === 'object' &&
           // web platform is optional: typeof registry.platforms.web === 'object' &&
           typeof registry.metadata === 'object' &&
           typeof registry.metadata.total_plugins === 'number';
    
    console.log(`  - Validation result: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    return isValid;
  }

  private getFallbackRegistry(): PluginRegistry {
    // Fallback registry with basic capabilities
    return {
      version: 1,
      platforms: {
        nodejs: {
          compression: {
            gzip: {
              name: 'droply-compression-gzip',
              version: '0.1.0',
              description: 'Gzip compression algorithm (fallback)',
              extensions: ['gz'],
              compression_levels: { min: 0, max: 9, default: 6 },
              paths: {
                wasm: './packages/plugins/gzip/wasm/index.wasm',
                module: './packages/plugins/gzip/nodejs/index.js',
                types: './packages/plugins/gzip/types/index.d.ts'
              }
            }
          },
          archives: {
            zip: {
              name: 'droply-archive-zip',
              version: '0.1.0',
              description: 'ZIP archive format (fallback)',
              extensions: ['zip'],
              features: ['compress-inside', 'metadata-embedding'],
              paths: {
                wasm: './packages/plugins/zip/wasm/index.wasm',
                module: './packages/plugins/zip/nodejs/index.js',
                types: './packages/plugins/zip/types/index.d.ts'
              }
            }
          },
          metadata: {
            generated_at: new Date().toISOString(),
            total_plugins: 2
          }
        },
        bundler: {
          compression: {
            gzip: {
              name: 'droply-compression-gzip',
              version: '0.1.0',
              description: 'Gzip compression algorithm (fallback)',
              extensions: ['gz'],
              compression_levels: { min: 0, max: 9, default: 6 },
              paths: {
                wasm: './packages/plugins/gzip/wasm/index.wasm',
                module: './packages/plugins/gzip/bundler/index.js',
                types: './packages/plugins/gzip/types/index.d.ts'
              }
            }
          },
          archives: {
            zip: {
              name: 'droply-archive-zip',
              version: '0.1.0',
              description: 'ZIP archive format (fallback)',
              extensions: ['zip'],
              features: ['compress-inside', 'metadata-embedding'],
              paths: {
                wasm: './packages/plugins/zip/wasm/index.wasm',
                module: './packages/plugins/zip/bundler/index.js',
                types: './packages/plugins/zip/types/index.d.ts'
              }
            }
          },
          metadata: {
            generated_at: new Date().toISOString(),
            total_plugins: 2
          }
        },
        web: {
          compression: {
            gzip: {
              name: 'droply-compression-gzip',
              version: '0.1.0',
              description: 'Gzip compression algorithm (fallback)',
              extensions: ['gz'],
              compression_levels: { min: 0, max: 9, default: 6 },
              paths: {
                wasm: './packages/plugins/gzip/wasm/index.wasm',
                module: './packages/plugins/gzip/web/index.js',
                types: './packages/plugins/gzip/types/index.d.ts'
              }
            }
          },
          archives: {
            zip: {
              name: 'droply-archive-zip',
              version: '0.1.0',
              description: 'ZIP archive format (fallback)',
              extensions: ['zip'],
              features: ['compress-inside', 'metadata-embedding'],
              paths: {
                wasm: './packages/plugins/zip/wasm/index.wasm',
                module: './packages/plugins/zip/web/index.js',
                types: './packages/plugins/zip/types/index.d.ts'
              }
            }
          },
          metadata: {
            generated_at: new Date().toISOString(),
            total_plugins: 2
          }
        }
      },
      metadata: {
        generated_at: new Date().toISOString(),
        total_plugins: 2
      }
    };
  }

  async getCurrentPlatform(): Promise<'nodejs' | 'bundler' | 'web'> {
    // Detect platform based on environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return 'nodejs';
    } else if (typeof window !== 'undefined' && typeof WebAssembly !== 'undefined') {
      // Check if we're in a bundler environment
      if (typeof require !== 'undefined' || typeof module !== 'undefined') {
        return 'bundler';
      }
      return 'web';
    }
    // Default fallback
    return 'nodejs';
  }

  async getSupportedPlatforms(): Promise<('nodejs' | 'bundler' | 'web')[]> {
    return ['nodejs', 'bundler', 'web'];
  }
}
