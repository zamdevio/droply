export function printArchiveHelp(log: any) {
  log.section('Archive Formats');
  log.info('Droply supports creating and extracting archive formats for multiple files.');
  
  log.section('Supported Formats');
  log.item('zip', 'ZIP archive format (most compatible)');
  log.item('tar', 'TAR archive format (Unix standard) - Limited support');
  
  log.section('Usage');
  log.info('• Multiple files automatically create archives');
  log.info('• Single files can be wrapped with --archive flag');
  log.info('• Archives can be compressed with --algo flag');
  
  log.section('Examples');
  log.info('droply compress dir/ --archive zip');
  log.info('droply compress file.txt --archive tar --algo gzip');
  log.info('droply compress docs/ --archive zip --algo brotli');
  
  log.section('Current Limitations');
  log.info('⚠️  TAR archiving support is experimental');
  log.info('⚠️  Created .tar.gz files may not be compatible with standard tar tools');
  log.info('💡 For maximum compatibility, use ZIP format');
}
