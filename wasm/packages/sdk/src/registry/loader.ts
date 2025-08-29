// registry/loader.ts - WASM Module Loader
// This loader dynamically imports plugins from @droply/plugins package
// using the proper subpath exports like @droply/plugins/nodejs/compression/gzip

import type { CompressionPlugin, ArchivePlugin } from './abi';

export interface ModuleLoader {
  loadCompressionPlugin(platform: string, algo: string): Promise<any>; // Returns loaded module with functions
  loadArchivePlugin(platform: string, algo: string): Promise<any>; // Returns loaded module with functions
}

export class DefaultModuleLoader implements ModuleLoader {
  private cache = new Map<string, any>();

  async loadCompressionPlugin(platform: string, algo: string): Promise<CompressionPlugin> {
    const cacheKey = `compression:${platform}:${algo}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // First, try to import using @droply/plugins subpath export (production mode)
      try {
        // Use dynamic import with string to avoid TypeScript compilation errors
        const pluginPath = `@droply/plugins/${platform}/compression/${algo}`;
        const pluginModule = await import(pluginPath);
        
        // Cache the loaded plugin
        this.cache.set(cacheKey, pluginModule);
        
        console.log(`✅ Successfully loaded compression plugin: ${platform}/compression/${algo} (from @droply/plugins)`);
        return pluginModule;
      } catch (importError) {
        console.log(`ℹ️  @droply/plugins not available, trying local paths for ${platform}/compression/${algo}...`);
      }

      // Fallback: try to load from local paths (development mode)
      // This will work when developing locally
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Try common local paths
      const possiblePaths = [
        `./packages/plugins/dist/${platform}/compression/${algo}/index.js`,
        `../packages/plugins/dist/${platform}/compression/${algo}/index.js`,
        `../../packages/plugins/dist/${platform}/compression/${algo}/index.js`
      ];
      
      for (const modulePath of possiblePaths) {
        try {
          const pluginModule = await import(modulePath);
          
          // Cache the loaded plugin
          this.cache.set(cacheKey, pluginModule);
          
          console.log(`✅ Successfully loaded compression plugin: ${platform}/compression/${algo} (from local path: ${modulePath})`);
          return pluginModule;
        } catch {
          continue; // Try next path
        }
      }
      
      // Try absolute paths based on current working directory
      const cwd = process.cwd();
      const absolutePaths = [
        path.join(cwd, 'packages', 'plugins', 'dist', platform, 'compression', algo, 'index.js'),
        path.join(cwd, 'wasm', 'packages', 'plugins', 'dist', platform, 'compression', algo, 'index.js'),
        path.join(cwd, '..', 'wasm', 'packages', 'plugins', 'dist', platform, 'compression', algo, 'index.js')
      ];
      
      for (const modulePath of absolutePaths) {
        try {
          const pluginModule = await import(modulePath);
          
          // Cache the loaded plugin
          this.cache.set(cacheKey, pluginModule);
          
          console.log(`✅ Successfully loaded compression plugin: ${platform}/compression/${algo} (from absolute path: ${modulePath})`);
          return pluginModule;
        } catch {
          continue; // Try next path
        }
      }
      
      throw new Error(`Could not find compression plugin ${platform}/compression/${algo} in any location`);
    } catch (error) {
      console.error(`❌ Failed to load compression plugin ${platform}/compression/${algo}:`, error);
      throw new Error(`Compression plugin not found: ${platform}/compression/${algo}`);
    }
  }

  async loadArchivePlugin(platform: string, algo: string): Promise<ArchivePlugin> {
    const cacheKey = `archive:${platform}:${algo}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // First, try to import using @droply/plugins subpath export (production mode)
      try {
        // Use dynamic import with string to avoid TypeScript compilation errors
        const pluginPath = `@droply/plugins/${platform}/archive/${algo}`;
        const pluginModule = await import(pluginPath);
        
        // Cache the loaded plugin
        this.cache.set(cacheKey, pluginModule);
        
        console.log(`✅ Successfully loaded archive plugin: ${platform}/archive/${algo} (from @droply/plugins)`);
        return pluginModule;
      } catch (importError) {
        console.log(`ℹ️  @droply/plugins not available, trying local paths for ${platform}/archive/${algo}...`);
      }

      // Fallback: try to load from local paths (development mode)
      // This will work when developing locally
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Try common local paths
      const possiblePaths = [
        `./packages/plugins/dist/${platform}/archive/${algo}/index.js`,
        `../packages/plugins/dist/${platform}/archive/${algo}/index.js`,
        `../../packages/plugins/dist/${platform}/archive/${algo}/index.js`
      ];
      
      for (const modulePath of possiblePaths) {
        try {
          const pluginModule = await import(modulePath);
          
          // Cache the loaded plugin
          this.cache.set(cacheKey, pluginModule);
          
          console.log(`✅ Successfully loaded archive plugin: ${platform}/archive/${algo} (from local path: ${modulePath})`);
          return pluginModule;
        } catch {
          continue; // Try next path
        }
      }
      
      // Try absolute paths based on current working directory
      const cwd = process.cwd();
      const absolutePaths = [
        path.join(cwd, 'packages', 'plugins', 'dist', platform, 'archive', algo, 'index.js'),
        path.join(cwd, 'wasm', 'packages', 'plugins', 'dist', platform, 'archive', algo, 'index.js'),
        path.join(cwd, '..', 'wasm', 'packages', 'plugins', 'dist', platform, 'archive', algo, 'index.js')
      ];
      
      for (const modulePath of absolutePaths) {
        try {
          const pluginModule = await import(modulePath);
          
          // Cache the loaded plugin
          this.cache.set(cacheKey, pluginModule);
          
          console.log(`✅ Successfully loaded archive plugin: ${platform}/archive/${algo} (from absolute path: ${modulePath})`);
          return pluginModule;
        } catch {
          continue; // Try next path
        }
      }
      
      throw new Error(`Could not find archive plugin ${platform}/archive/${algo} in any location`);
    } catch (error) {
      console.error(`❌ Failed to load archive plugin ${platform}/archive/${algo}:`, error);
      throw new Error(`Archive plugin not found: ${platform}/archive/${algo}`);
    }
  }

  // Clear cache if needed
  clearCache(): void {
    this.cache.clear();
  }
}
