import * as path from 'node:path';
import { symbols, colors, styles } from './theme';
import { detectColor, isTTY, getTerminalWidth } from './detect';
import { bold } from 'colorette';

type Opts = { 
  verbose?: boolean; 
  json?: boolean; 
  useColor?: boolean; 
  stream?: NodeJS.WriteStream 
};

export function createLogger({ 
  verbose = false, 
  json = false, 
  useColor, 
  stream = process.stdout 
}: Opts) {
  const colorOn = useColor ?? detectColor({ json });
  const w = getTerminalWidth();
  const color = <T extends Function>(fn: T) => (s: string) => colorOn ? (fn as any)(s) : s;
  
  const c = {
    primary: color(colors.primary), 
    subtle: color(colors.subtle), 
    success: color(colors.success),
    warn: color(colors.warn), 
    error: color(colors.error), 
    accent: color(colors.accent), 
    file: color(colors.file),
    strong: color(styles.strong), 
    dim: color(styles.dim)
  };
  
  const sym = (s: string) => colorOn ? s : s;

  const write = (s: string) => stream.write(s + '\n');

  const section = (title: string) => {
    write(`${c.primary(sym(symbols.section))} ${c.strong(title)}`);
  };

  const line = (lead: string, msg: string) => write(`${lead} ${msg}`);

  const info = (msg: string) => line(c.accent(sym(symbols.info)), msg);
  const success = (msg: string) => line(c.success(sym(symbols.success)), c.strong(msg));
  const warn = (msg: string) => line(c.warn(sym(symbols.warn)), msg);
  const error = (msg: string) => line(c.error(sym(symbols.error)), c.strong(msg));

  const item = (label: string, value?: string) => {
    const left = `${c.subtle(sym(symbols.item))} ${label}`;
    if (!value) return write(left);
    const maxLeft = Math.min(left.length, Math.max(0, w - value.length - 2));
    write(left.padEnd(maxLeft, ' ') + '  ');
    write(c.file(value));
  };

  const debug = (msg: string, data?: unknown) => {
    if (!verbose) return;
    const serialized = data ? `\n  ${c.subtle(JSON.stringify(data, null, 2))}` : '';
    write(`${c.subtle(sym(symbols.verbose))} ${c.subtle(msg)}${serialized}`);
  };

  const jsonLog = (ev: { level: string; msg: string; data?: any }) => {
    stream.write(JSON.stringify({ time: new Date().toISOString(), ...ev }) + '\n');
  };

  // Naive spinner/progress (TTY only)
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const spinner = (label: string) => {
    if (!isTTY() || json) { 
      info(label); 
      return { 
        succeed: (m?: string) => m && success(m), 
        fail: (m?: string) => m && error(m), 
        stop: () => {} 
      }; 
    }
    
    let i = 0, active = true;
    const id = setInterval(() => {
      if (!active) return;
      const f = frames[i = (i + 1) % frames.length];
      stream.write(`\r${c.accent(f)} ${label}   `);
    }, 80);
    
    return {
      succeed: (m?: string) => { 
        active = false; 
        clearInterval(id); 
        stream.write('\r'); 
        success(m ?? label); 
      },
      fail: (m?: string) => { 
        active = false; 
        clearInterval(id); 
        stream.write('\r'); 
        error(m ?? label); 
      },
      stop: () => { 
        active = false; 
        clearInterval(id); 
        stream.write('\r'); 
      }
    };
  };

  const progress = ({ label, current, total }: { label: string; current: number; total?: number }) => {
    if (!isTTY() || json || !total) return info(`${label}: ${current}${total ? `/${total}` : ''}`);
    const width = Math.max(10, Math.min(30, Math.floor(w * 0.3)));
    const pct = Math.min(1, current / total);
    const done = Math.round(pct * width);
    const bar = c.primary('█'.repeat(done)) + c.subtle('░'.repeat(width - done));
    write(`${bar} ${c.dim(`${Math.round(pct * 100)}%`)} ${label}`);
  };

  const table = (rows: Array<Record<string, string | number>>) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const widths = headers.map(h => Math.max(h.length, ...rows.map(r => String(r[h] ?? '').length)));
    write(headers.map((h, i) => c.strong(String(h).padEnd(widths[i]))).join('  '));
    rows.forEach(r => {
      write(headers.map((h, i) => String(r[h] ?? '').padEnd(widths[i])).join('  '));
    });
  };

  const api = { section, info, success, warn, error, item, debug, spinner, progress, table, json: jsonLog };
  return json ? new Proxy(api, { get: (_, k: string) => k === 'json' ? api.json : () => {} }) as any : api;
}

// Tiny ansi stripper if colorette has no strip export
function stripAnsi(s: string) { 
  return s.replace(/\x1B\[[0-9;]*m/g, ''); 
}
