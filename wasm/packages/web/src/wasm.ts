// Re-export everything from SDK (like CLI does)
export * from '@droply/sdk';

// Web-specific WASM utilities (only what's not in SDK)
export function isWasmSupported(): boolean {
  return typeof WebAssembly !== 'undefined' && 
         typeof WebAssembly.instantiate === 'function';
}

export function getWasmCapabilities() {
  if (!isWasmSupported()) {
    return { supported: false, streaming: false, simd: false, threads: false };
  }

  return {
    supported: true,
    streaming: typeof WebAssembly.instantiateStreaming === 'function',
    simd: false, // SIMD support detection would go here
    threads: typeof Worker !== 'undefined'
  };
}
/*
// Re-export SDK's plugin loading functions
export {
  loadCompressionWasm,
  loadArchiveWasm,
  loadCompressionPlugin,
  loadArchivePlugin,
  preloadAllWasm,
  getWasmUrls
} from '@droply/sdk';

*/