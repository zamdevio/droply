// utils/compressor.ts
import { Registry } from '../registry';
import { DefaultModuleLoader } from '../registry/loader';
import type { CompressionAlgo, ICompressor } from './types';

export async function getCompressor(algo: CompressionAlgo): Promise<ICompressor> {
  try {
    // Use the new registry system
    const registry = new Registry();
    
    // Check if algorithm is supported
    if (!(await registry.isCompressionAlgorithmSupported(algo))) {
      throw new Error(`Unsupported compression algorithm: ${algo}`);
    }
    
    // Get the current platform
    const platform = await registry.getCurrentPlatform();
    
    // Use the module loader to get the actual plugin functions
    const moduleLoader = new DefaultModuleLoader();
    const pluginModule = await moduleLoader.loadCompressionPlugin(platform, algo);
    
    if (!pluginModule) {
      throw new Error(`Failed to load compression plugin: ${algo} for platform ${platform}`);
    }
    
    // The plugin module contains the actual functions, not just metadata
    // TypeScript doesn't know the exact shape, so we use any for the loaded module
    const loadedModule = pluginModule as any;
    
    // The plugin should export compress/decompress functions
    const compressFn = loadedModule.compress || loadedModule.default?.compress;
    const decompressFn = loadedModule.decompress || loadedModule.default?.decompress;
    
    if (typeof compressFn !== 'function' || typeof decompressFn !== 'function') {
      throw new Error(`Bad exports for ${algo} plugin`);
    }

    // Wrap into uniform ICompressor
    const adapter: ICompressor = {
      async compress(input, opts) {
        return compressFn(input, opts?.level ?? 6);
      },
      async decompress(input) {
        return decompressFn(input);
      },
    };
    return adapter;
  } catch (e) {
    throw new Error(`Failed to load ${algo} compressor: ${e}`);
  }
}
