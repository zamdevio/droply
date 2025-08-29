import * as os from 'node:os';

export function detectColor({ json }: { json?: boolean }) {
  const env = process.env;
  if (json) return false;
  if ('NO_COLOR' in env) return false;
  if (env.FORCE_COLOR) return true;
  return Boolean(process.stdout && process.stdout.isTTY);
}

export function isTTY() {
  return Boolean(process.stdout && process.stdout.isTTY);
}

export function getTerminalWidth() {
  return process.stdout?.columns ?? 80;
}
