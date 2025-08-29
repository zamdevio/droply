import { META_SCHEMA_VERSION } from './constants';
import type { MetaDoc } from './types';

export function composeMeta(input: {
  operation: MetaDoc['operation'];
  archive?: MetaDoc['archive'];
  algo?: MetaDoc['algo'];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  files: MetaDoc['files'];
  totals: MetaDoc['totals'];
  environment: MetaDoc['environment'];
}): MetaDoc {
  return {
    version: META_SCHEMA_VERSION,
    operation: input.operation,
    archive: input.archive ?? null,
    algo: input.algo ?? null,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    durationMs: input.durationMs,
    files: input.files,
    totals: input.totals,
    environment: input.environment,
  };
}
