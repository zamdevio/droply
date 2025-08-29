import type { MetaOptions } from './types';
import { RESERVED_DIR } from './constants';

export function detectUserSpoofing(inputNames: string[], allowUserMeta: boolean) {
  const offenders = inputNames.filter(n => 
    n === RESERVED_DIR || 
    n.startsWith(`${RESERVED_DIR}/`) || 
    n.includes(`.${RESERVED_DIR}.`) ||
    n.includes(`/${RESERVED_DIR}/`)
  );
  if (offenders.length && !allowUserMeta) {
    const details = offenders.slice(0, 3).join(', ') + (offenders.length > 3 ? '…' : '');
    throw new Error(`Refusing to proceed: input contains reserved path '${RESERVED_DIR}/' (${details}). `
      + `This path is used for Droply metadata inside archives. `
      + `Re-run with --allow-user-meta to bypass (not recommended).`);
  }
}

export function decideEmbed({
  hasArchive, requestedEmbed, noMetaFlag,
}: { hasArchive: boolean; requestedEmbed: boolean; noMetaFlag: boolean }): boolean {
  if (noMetaFlag) return false;
  // We only embed if an archive is being created/finalized.
  return hasArchive && requestedEmbed;
}
