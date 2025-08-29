export function printAlgoHelp(log: any) {
  log.section('Compression Algorithms');
  log.info('Droply supports multiple high-performance compression algorithms.');
  
  log.section('Supported Algorithms');
  log.item('gzip', 'GZIP compression (level 0-9, default: 6)');
  log.item('brotli', 'Brotli compression (level 0-11, default: 6)');
  log.item('deflate', 'DEFLATE compression (level 0-9, default: 6)');
  log.item('zip', 'ZIP compression (level 0-9, default: 6)');
  
  log.section('Levels');
  log.info('• Higher levels = better compression but slower');
  log.info('• Lower levels = faster but less compression');
  log.info('• Level 0 = no compression (store only)');
  
  log.section('Examples');
  log.info('droply compress file.txt --algo gzip --level 9');
  log.info('droply compress docs/ --algo brotli --level 11');
  log.info('droply compress backup/ --algo zip --level 6');
}
