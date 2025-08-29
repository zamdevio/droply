// utils/wasm-loader.ts - Universal WASM loader for Node.js and browsers
import type { ModuleDescriptor, WasmModuleKind } from './types';

type AnyExports = Record<string, any>;

// global cache across server requests & shared on the client
const cacheKey = '__droply_wasm_cache__';
const g = globalThis as any;
g[cacheKey] ??= new Map<string, Promise<AnyExports>>();
const moduleCache: Map<string, Promise<AnyExports>> = g[cacheKey];

// 🧠 Environment detection
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof window !== 'undefined' && typeof fetch !== 'undefined';

// Node.js specific imports (lazy loaded when needed)
let fs: any, path: any, url: any;

async function getNodeModules() {
  if (!fs && isNode) {
    try {
      fs = await import('fs');
      path = await import('path');
      url = await import('url');
    } catch (e) {
      // Ignore import errors
    }
  }
  return { fs, path, url };
}

async function loadRaw(wasmPath: string): Promise<AnyExports> {
  if (isNode) {
    // Node.js: read file directly
    const { fs: nodeFs } = await getNodeModules();
    const wasmBuffer = nodeFs.readFileSync(wasmPath);
    const { instance } = await WebAssembly.instantiate(wasmBuffer);
    return instance.exports as AnyExports;
  } else {
    // Browser: use fetch
    const res = await fetch(wasmPath);
    if (!res.ok) throw new Error(`WASM fetch failed: ${wasmPath} ${res.status}`);
    const { instance } = await WebAssembly.instantiateStreaming(res);
    return instance.exports as AnyExports;
  }
}

// wasm-bindgen: dynamic import JS init, then pass the .wasm
async function loadBindgen(jsInitPath: string, wasmPath: string): Promise<AnyExports> {
  try {
    let resolvedJsPath = jsInitPath;
    let resolvedWasmPath = wasmPath;
    
    if (isNode) {
      // Node.js: resolve relative paths
      const { path: nodePath, url: nodeUrl } = await getNodeModules();
      const __filename = nodeUrl.fileURLToPath(import.meta.url);
      const __dirname = nodePath.dirname(__filename);
      
      if (jsInitPath.startsWith('./')) {
        resolvedJsPath = nodePath.join(__dirname, '..', jsInitPath);
      }
      if (wasmPath.startsWith('./')) {
        resolvedWasmPath = nodePath.join(__dirname, '..', wasmPath);
      }
    }
    
    // Import the JS module
    const jsModule = await import(/* @vite-ignore */ resolvedJsPath);
    const init = jsModule.default ?? jsModule;
    
    if (typeof init !== 'function') {
      throw new Error(`Invalid init function in ${jsInitPath}`);
    }
    
    // Initialize WASM based on environment
    if (isNode) {
      // Node.js: read WASM file and pass buffer
      const { fs: nodeFs } = await getNodeModules();
      const wasmBuffer = nodeFs.readFileSync(resolvedWasmPath);
      const exports = await init(wasmBuffer);
      return exports as AnyExports;
    } else {
      // Browser: pass WASM URL (wasm-pack handles fetch)
      const exports = await init(wasmPath);
      return exports as AnyExports;
    }
  } catch (error) {
    console.error(`Error loading bindgen module:`, error);
    throw new Error(`Failed to load bindgen module: ${error}`);
  }
}

export function loadWasmModule(desc: ModuleDescriptor): Promise<AnyExports> {
  const key = `${desc.kind}:${desc.wasmPath}:${desc.jsInitPath ?? ''}`;
  if (moduleCache.has(key)) return moduleCache.get(key)!;

  const p = (async () => {
    if (desc.kind === 'raw') {
      return loadRaw(desc.wasmPath);
    } else if (desc.kind === 'bindgen') {
      if (!desc.jsInitPath) throw new Error('bindgen module missing jsInitPath');
      return loadBindgen(desc.jsInitPath, desc.wasmPath);
    }
    throw new Error(`Unknown WASM module kind: ${(desc as any).kind}`);
  })();

  moduleCache.set(key, p);
  return p;
}
