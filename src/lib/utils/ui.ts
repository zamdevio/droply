// UI utility functions for file handling
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.floor(Math.log(bytes) / Math.log(k)));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.startsWith('audio/')) return '🎵';
  if (type.startsWith('text/')) return '📄';
  if (type.includes('pdf')) return '📕';
  if (type.includes('word') || type.includes('document')) return '📘';
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '📦';
  if (type.includes('javascript') || type.includes('typescript')) return '💻';
  if (type.includes('html') || type.includes('css')) return '🌐';
  
  return '📁';
}

export function isArchiveFile(type: string): boolean {
  return type.includes('zip') || type.includes('rar') || type.includes('7z') || 
         type.includes('tar') || type.includes('gz');
}

export function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

export function isVideoFile(type: string): boolean {
  return type.startsWith('video/');
}

export function isAudioFile(type: string): boolean {
  return type.startsWith('audio/');
}

export function isDocumentFile(type: string): boolean {
  return type.includes('pdf') || type.includes('word') || type.includes('document') ||
         type.includes('text/') || type.includes('rtf');
}

// File type detection utilities
export function detectFileType(file: File): { isArchive: boolean; isMultiFile: boolean; type: string } {
  const type = file.type;
  const isArchive = isArchiveFile(type);
  const isMultiFile = isArchive && type === 'application/zip';
  
  return {
    isArchive,
    isMultiFile,
    type
  };
}

// Metadata utilities
export function parseMetadata(metaString: string | null): any[] | null {
  if (!metaString) return null;
  
  try {
    return JSON.parse(metaString);
  } catch (error) {
    console.error('Failed to parse metadata:', error);
    return null;
  }
}

export function stringifyMetadata(meta: any[] | null): string | null {
  if (!meta) return null;
  
  try {
    return JSON.stringify(meta);
  } catch (error) {
    console.error('Failed to stringify metadata:', error);
    return null;
  }
}
