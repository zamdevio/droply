// 🚀 Dynamic Plugin Registry System
// Automatically discovers and loads WASM plugins from the build directory

import type { ModuleDescriptor, CompressionAlgo, ArchiveAlgo, PluginInfo } from './types';

export interface DynamicPlugin {
  name: string;
  type: 'compression' | 'archive';
  version: string;
  capabilities: string[];
  supportedFormats: string[];
  module: any;
  wasmInstance?: WebAssembly.Instance;
  isLoaded: boolean;
  loadTime?: number;
  error?: string;
}

export interface PluginRegistry {
  compression: Map<string, DynamicPlugin>;
  archive: Map<string, DynamicPlugin>;
  totalPlugins: number;
  lastScan: Date;
  scanErrors: string[];
}

export class DynamicRegistry {
  private static instance: DynamicRegistry;
  private registry: PluginRegistry;
  private basePath: string;
  private isInitialized: boolean = false;

  private constructor() {
    this.registry = {
      compression: new Map(),
      archive: new Map(),
      totalPlugins: 0,
      lastScan: new Date(),
      scanErrors: []
    };
    this.basePath = './build';
  }

  static getInstance(): DynamicRegistry {
    if (!DynamicRegistry.instance) {
      DynamicRegistry.instance = new DynamicRegistry();
    }
    return DynamicRegistry.instance;
  }

  /**
   * 🔍 Scan build directory for available plugins
   * This is called automatically on first access
   */
  async scanPlugins(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 Scanning for WASM plugins...');
      
      // In a real implementation, this would scan the filesystem
      // For now, we'll use the static registry as a fallback
      await this.loadStaticRegistry();
      
      this.isInitialized = true;
      this.registry.lastScan = new Date();
      
      console.log(`✅ Plugin scan complete. Found ${this.registry.totalPlugins} plugins`);
    } catch (error) {
      console.error('❌ Plugin scan failed:', error);
      this.registry.scanErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 📦 Load a specific plugin by name
   */
  async loadPlugin(name: string, type: 'compression' | 'archive'): Promise<DynamicPlugin | null> {
    await this.scanPlugins();
    
    const pluginMap = type === 'compression' ? this.registry.compression : this.registry.archive;
    const plugin = pluginMap.get(name);
    
    if (!plugin) {
      console.warn(`⚠️ Plugin not found: ${name} (${type})`);
      return null;
    }

    if (plugin.isLoaded) {
      return plugin;
    }

    try {
      console.log(`🔄 Loading plugin: ${name} (${type})`);
      const startTime = Date.now();
      
      // Load WASM module
      const wasmModule = await this.loadWasmModule(name, type);
      plugin.module = wasmModule;
      plugin.wasmInstance = wasmModule.instance;
      plugin.isLoaded = true;
      plugin.loadTime = Date.now() - startTime;
      
      console.log(`✅ Plugin loaded: ${name} in ${plugin.loadTime}ms`);
      return plugin;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      plugin.error = errorMsg;
      console.error(`❌ Failed to load plugin ${name}:`, errorMsg);
      return null;
    }
  }

  /**
   * 🚀 Get all available compression algorithms
   */
  async getCompressionAlgorithms(): Promise<CompressionAlgo[]> {
    await this.scanPlugins();
    return Array.from(this.registry.compression.keys()) as CompressionAlgo[];
  }

  /**
   * 📦 Get all available archive algorithms
   */
  async getArchiveAlgorithms(): Promise<ArchiveAlgo[]> {
    await this.scanPlugins();
    return Array.from(this.registry.archive.keys()) as ArchiveAlgo[];
  }

  /**
   * 🔍 Check if an algorithm is supported
   */
  async isAlgorithmSupported(name: string, type: 'compression' | 'archive'): Promise<boolean> {
    await this.scanPlugins();
    const pluginMap = type === 'compression' ? this.registry.compression : this.registry.archive;
    return pluginMap.has(name);
  }

  /**
   * 📊 Get plugin statistics
   */
  getStats(): PluginRegistry {
    return { ...this.registry };
  }

  /**
   * 🔄 Reload all plugins
   */
  async reload(): Promise<void> {
    this.isInitialized = false;
    this.registry.compression.clear();
    this.registry.archive.clear();
    this.registry.totalPlugins = 0;
    this.registry.scanErrors = [];
    await this.scanPlugins();
  }

  /**
   * 📋 Get detailed plugin information
   */
  getPluginInfo(name: string, type: 'compression' | 'archive'): DynamicPlugin | null {
    const pluginMap = type === 'compression' ? this.registry.compression : this.registry.archive;
    return pluginMap.get(name) || null;
  }

  /**
   * 🧹 Clean up resources
   */
  async cleanup(): Promise<void> {
    for (const plugin of this.registry.compression.values()) {
      if (plugin.wasmInstance) {
        // Clean up WASM instance if needed
        plugin.wasmInstance = undefined;
      }
      plugin.isLoaded = false;
    }
    
    for (const plugin of this.registry.archive.values()) {
      if (plugin.wasmInstance) {
        plugin.wasmInstance = undefined;
      }
      plugin.isLoaded = false;
    }
  }

  /**
   * 🔧 Load WASM module dynamically
   */
  private async loadWasmModule(name: string, type: 'compression' | 'archive'): Promise<any> {
    // This would dynamically import the WASM module
    // In a real implementation, you'd use dynamic imports or fetch
    const modulePath = `${this.basePath}/${type}/${name}/module.js`;
    
    try {
      // Dynamic import of the WASM module
      const module = await import(modulePath);
      return module;
    } catch (error) {
      throw new Error(`Failed to load WASM module from ${modulePath}: ${error}`);
    }
  }

  /**
   * 📚 Load static registry as fallback
   */
  private async loadStaticRegistry(): Promise<void> {
    // Import the static registry as a fallback
    const { CompressionRegistry, ArchiveRegistry } = await import('./registry');
    
    // Convert static registry to dynamic plugins
    for (const [name, descriptor] of Object.entries(CompressionRegistry)) {
      const plugin: DynamicPlugin = {
        name,
        type: 'compression',
        version: '1.0.0',
        capabilities: ['compress', 'decompress'],
        supportedFormats: [name],
        module: null,
        isLoaded: false
      };
      this.registry.compression.set(name, plugin);
    }
    
    for (const [name, descriptor] of Object.entries(ArchiveRegistry)) {
      const plugin: DynamicPlugin = {
        name,
        type: 'archive',
        version: '1.0.0',
        capabilities: ['pack', 'unpack'],
        supportedFormats: [name],
        module: null,
        isLoaded: false
      };
      this.registry.archive.set(name, plugin);
    }
    
    this.registry.totalPlugins = this.registry.compression.size + this.registry.archive.size;
  }
}

// 🎯 Convenience functions
export const dynamicRegistry = DynamicRegistry.getInstance();

export async function getCompressionAlgorithms(): Promise<CompressionAlgo[]> {
  return await dynamicRegistry.getCompressionAlgorithms();
}

export async function getArchiveAlgorithms(): Promise<ArchiveAlgo[]> {
  return await dynamicRegistry.getArchiveAlgorithms();
}

export async function isAlgorithmSupported(name: string, type: 'compression' | 'archive'): Promise<boolean> {
  return await dynamicRegistry.isAlgorithmSupported(name, type);
}

export function getPluginStats(): PluginRegistry {
  return dynamicRegistry.getStats();
}
