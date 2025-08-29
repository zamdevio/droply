export type MetaFormat = 'text' | 'json';

export interface MetaOptions {
  embed: boolean;              // whether we embed into archive (after policy)
  show: boolean;               // whether to print meta after run (from --meta)
  format: MetaFormat;          // printing format for show
  metaDir: string;             // ".droply"
  metaName: string;            // "__droply_meta.json"
  allowUserMeta: boolean;
}

export interface MetaDoc {
  version: string;             // schema version
  operation: 'compress' | 'decompress';
  archive?: 'zip' | 'tar' | null;
  algo?: 'gzip' | 'brotli' | 'deflate' | 'zip' | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  files: Array<{
    name: string;
    originalSize: number;
    compressedSize?: number;
    crc32?: string;
    sha256?: string;
    mtime?: string;
    method?: string;
    extra?: Record<string, unknown>;
  }>;
  totals: { original: number; compressed?: number; ratio?: number };
  environment: { runtime: 'node' | 'browser' | 'cli'; wasm: boolean; versions?: Record<string, string> };
}
