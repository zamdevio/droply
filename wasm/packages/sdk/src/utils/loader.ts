// utils/wasm-loader.ts - Universal WASM loader for Node.js and browsers
import type { ModuleDescriptor, WasmModuleKind } from './types';

type AnyExports = Record<string, any>;

// Node.js require type for dynamic require calls
type NodeRequire = {
  resolve: (id: string) => string;
};

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

// 🎯 Resolve paths relative to the plugins directory
function resolvePluginPath(relativePath: string): string {
  if (isNode) {
    // For Node.js, resolve relative to the plugins directory
    // The SDK is at wasm/packages/sdk/src/utils/, plugins are at wasm/packages/plugins/
    // So we need to go up 3 levels from src/utils/ to reach packages/, then into plugins
    // Remove the leading ./ if present to avoid path issues
    const cleanPath = relativePath.startsWith('./') ? relativePath.slice(2) : relativePath;
    
    // Try multiple possible paths for different working directories
    const possiblePaths = [
      `../../../plugins/${cleanPath}`,           // From wasm/packages/sdk/src/utils/
      `../../packages/plugins/${cleanPath}`,     // From wasm/packages/cli (CLI working dir)
      `../packages/plugins/${cleanPath}`,        // From wasm/packages/sdk/
      `packages/plugins/${cleanPath}`,           // From wasm/ (project root)
    ];
    
    // For now, return the CLI working directory path since that's where we're running from
    return `../../packages/plugins/${cleanPath}`;
  } else {
    // For web, use the relative path as-is (assuming it's served from the plugins directory)
    return relativePath;
  }
}

export async function getAbsolutePluginPath(relativePath: string): Promise<string> {
  if (!isNode) return relativePath; // browser: keep as-is

  const { path: nodePath, fs: nodeFs } = await getNodeModules();
  const clean = relativePath.replace(/^[.][\\/]/, ''); // strip leading "./" or ".\"
  const cwd = process.cwd();

  // 1) Try resolving the installed package (@droply/plugins) – works in CJS & ESM
  try {
    // eslint-disable-next-line no-new-func
    const req: NodeRequire = (Function('return require'))();
    const pluginsPkg = req.resolve('@droply/plugins/package.json');
    const pluginsRoot = nodePath.dirname(pluginsPkg);
    const abs = nodePath.join(pluginsRoot, clean);
    return abs;
  } catch {
    // ignore and try fallbacks
  }

  // 2) Monorepo fallback: look for local packages/plugins
  const candidates = [
    nodePath.join(cwd, 'packages', 'plugins'),                 // project root
    nodePath.join(cwd, '..', 'packages', 'plugins'),           // run from subpkg
    nodePath.join(cwd, '../../packages', 'plugins'),           // deeper
  ];

  for (const base of candidates) {
    if (nodeFs.existsSync(nodePath.join(base, 'registry.json')) ||
        nodeFs.existsSync(nodePath.join(base, 'build'))) {
      const abs = nodePath.join(base, clean);
      return abs;
    }
  }

  // 3) Last ditch: node_modules/@droply/plugins (when not resolvable via require)
  const nm = nodePath.join(cwd, 'node_modules', '@droply', 'plugins');
  const abs = nodePath.join(nm, clean);
  return abs;
}



async function loadRaw(wasmPath: string): Promise<AnyExports> {
  const resolvedPath = resolvePluginPath(wasmPath);
  
  if (isNode) {
    // Node.js: read file directly
    const { fs: nodeFs, path: nodePath } = await getNodeModules();
    const absolutePath = nodePath.resolve(process.cwd(), resolvedPath);
    const wasmBuffer = nodeFs.readFileSync(absolutePath);
    const { instance } = await WebAssembly.instantiate(wasmBuffer);
    return instance.exports as AnyExports;
  } else {
    // Browser: use fetch
    const res = await fetch(resolvedPath);
    if (!res.ok) throw new Error(`WASM fetch failed: ${resolvedPath} ${res.status}`);
    const { instance } = await WebAssembly.instantiateStreaming(res);
    return instance.exports as AnyExports;
  }
}

// wasm-bindgen: dynamic import JS init, then pass the .wasm
async function loadBindgen(jsInitPath: string, wasmPath: string): Promise<AnyExports> {
  try {
    if (isNode) {
      // Node.js: resolve to absolute paths
      const absoluteJsPath = await getAbsolutePluginPath(jsInitPath);
      const absoluteWasmPath = await getAbsolutePluginPath(wasmPath);
      
      // Import the JS module using absolute path
      const jsModule = await import(/* @vite-ignore */ absoluteJsPath);
      
      // Check if it's a CommonJS module (Node.js build) or ES module (web build)
      if (jsModule.default && typeof jsModule.default === 'function') {
        // ES module with init function (web build)
        const init = jsModule.default;
        
        // Read WASM file and pass buffer
        const { fs: nodeFs } = await getNodeModules();
        const wasmBuffer = nodeFs.readFileSync(absoluteWasmPath);
        const exports = await init(wasmBuffer);
        return exports as AnyExports;
      } else {
        // CommonJS module (Node.js build) - no init function needed
        // The module is already initialized and ready to use
        return jsModule as AnyExports;
      }
    } else {
      // Browser: import JS module and pass WASM URL
      const resolvedJsPath = resolvePluginPath(jsInitPath);
      const resolvedWasmPath = resolvePluginPath(wasmPath);
      
      const jsModule = await import(/* @vite-ignore */ resolvedJsPath);
      const init = jsModule.default ?? jsModule;
      
      if (typeof init !== 'function') {
        throw new Error(`Invalid init function in ${resolvedJsPath}`);
      }
      
      // Pass WASM URL (wasm-pack handles fetch)
      const exports = await init(resolvedWasmPath);
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
