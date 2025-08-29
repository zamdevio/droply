// utils/archiver.ts
import { ArchiveRegistry } from './registry';
import { loadWasmModule } from './loader';
import type { ArchiveAlgo, IArchiver } from './types';
export async function getArchiver(algo: ArchiveAlgo): Promise<IArchiver> {
  const desc = ArchiveRegistry[algo];
  if (!desc) throw new Error(`Unknown archiver: ${algo}`);

  try {
    const exp = await loadWasmModule(desc);
    const packFn  = exp[desc.exports?.pack  ?? 'pack'];
    const unpackFn= exp[desc.exports?.unpack?? 'unpack'];
    if (typeof packFn !== 'function' || typeof unpackFn !== 'function') {
      throw new Error(`Bad exports for archiver ${algo}`);
    }

    const adapter: IArchiver = {
      async pack(files, _opts) { return packFn(files); },
      async unpack(bytes) { return unpackFn(bytes); },
    };
    return adapter;
  } catch (e) {
    throw new Error(`Failed to load ${algo} archiver`);
  }
}

