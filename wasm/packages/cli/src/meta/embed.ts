import { TextEncoder } from 'node:util';
import { DEFAULT_META_DIR, DEFAULT_META_NAME } from './constants';
import type { MetaDoc } from './types';

// You already have archive builders; we call their APIs from here.
// Expect to receive a ready-to-embed MetaDoc and target path pieces.
export async function embedMetaZip(zipBuilder: {
  addFile: (name: string, bytes: Uint8Array, opts?: any) => Promise<void> | void;
}, meta: MetaDoc, { metaDir = DEFAULT_META_DIR, metaName = DEFAULT_META_NAME } = {}) {
  const json = JSON.stringify(meta, null, 2);
  const bytes = new TextEncoder().encode(json);
  const entryPath = `${metaDir}/${metaName}`;
  await zipBuilder.addFile(entryPath, bytes, { method: 'store' });
}

export async function embedMetaTar(tarBuilder: {
  addFile: (name: string, bytes: Uint8Array, opts?: any) => Promise<void> | void;
}, meta: MetaDoc, { metaDir = DEFAULT_META_DIR, metaName = DEFAULT_META_NAME } = {}) {
  const json = JSON.stringify(meta, null, 2);
  const bytes = new TextEncoder().encode(json);
  const entryPath = `${metaDir}/${metaName}`;
  await tarBuilder.addFile(entryPath, bytes, { mode: 0o644, mtime: Math.floor(Date.now() / 1000) });
}
