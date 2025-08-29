// utils/compressor.ts
import { CompressionRegistry } from './registry';
import { loadWasmModule } from './loader';
import type { CompressionAlgo, ICompressor } from './types';

export async function getCompressor(algo: CompressionAlgo): Promise<ICompressor> {
  const desc = CompressionRegistry[algo];
  if (!desc) throw new Error(`Unknown compressor: ${algo}`);

  try {
    const exp = await loadWasmModule(desc);
    // Normalize export names
    const compressFn   = exp[desc.exports?.compress ?? 'compress'];
    const decompressFn = exp[desc.exports?.decompress ?? 'decompress'];
    if (typeof compressFn !== 'function' || typeof decompressFn !== 'function') {
      throw new Error(`Bad exports for ${algo}`);
    }

    // Wrap into uniform ICompressor
    const adapter: ICompressor = {
      async compress(input, opts) {
        // Note: wasm-pack often wants Uint8Array; keep it zero-copy.
        return compressFn(input, opts?.level ?? 6);
      },
      async decompress(input) {
        return decompressFn(input);
      },
    };
    return adapter;
  } catch (e) {
    throw new Error(`Failed to load ${algo} compressor`);
  }
}
