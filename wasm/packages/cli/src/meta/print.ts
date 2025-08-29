import type { MetaDoc, MetaFormat } from './types';

export function printMeta(meta: MetaDoc, format: MetaFormat, log: {
  info: (s: string) => void; json: (ev: any) => void; section: (s: string) => void; item: (l: string, v?: string) => void;
}) {
  if (format === 'json') {
    return log.json({ level: 'info', msg: 'meta', data: meta });
  }
  log.section('Metadata');
  log.item('operation', meta.operation);
  if (meta.archive) log.item('archive', meta.archive);
  if (meta.algo) log.item('algo', meta.algo);
  log.item('duration', `${meta.durationMs}ms`);
  log.item('files', String(meta.files.length));
  const t = meta.totals;
  if (t.original) log.item('total.original', `${t.original}`);
  if (t.compressed) log.item('total.compressed', `${t.compressed}`);
  if (t.ratio !== undefined) log.item('total.ratio', `${(t.ratio * 100).toFixed(1)}%`);
}
