export function printMetaHelp(log: any) {
  log.section('Metadata (Droply)');
  log.info('Droply records a JSON metadata document describing operations, timing, totals, and files.');
  log.info('This metadata is embedded only inside archives at a reserved path by default.');
  
  log.section('Defaults');
  log.item('Archive builds', 'metadata embedded at .droply/__droply_meta.json');
  log.item('Non-archive (pure gzip/brotli/deflate)', 'metadata is NOT embedded (to preserve full compatibility)');
  log.item('Use --meta', 'to print metadata after the run (text or JSON)');
  
  log.section('Flags');
  log.item('--meta', 'Show metadata after command completes (printing only)');
  log.item('--meta-format <fmt>', "'text' | 'json' (default: text)");
  log.item('--meta-path <path>', 'In-archive directory (default: .droply/)');
  log.item('--meta-name <name>', 'Metadata filename (default: __droply_meta.json)');
  log.item('--no-meta', 'Do not embed metadata (even when archiving)');
  log.item('--allow-user-meta', 'Allow inputs that already contain \'.droply/*\' (not recommended)');
  
  log.section('Notes');
  log.info('• We never inject metadata into raw compressed files (.gz, .br, .deflate) — that breaks standard tools.');
  log.info('• To keep metadata inside the result for a single file, use an archive:');
  log.info('    droply compress file.txt --archive tar --algo gzip');
  log.info('    # produces file.tar.gz with meta at .droply/__droply_meta.json');
}
