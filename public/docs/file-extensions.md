# 🔥 File Extension Naming Convention

This document describes the file extension naming convention implemented in Droply for consistent and intuitive file naming based on archive type and compression algorithm.

## 📚 Overview

The file extension naming system automatically generates appropriate file extensions based on:
- **Archive Type**: How files are bundled (none, zip, tar)
- **Compression Algorithm**: How data is compressed (none, gzip, brotli, zip)

## 🎯 Naming Convention Table

| Archive | Algo   | Output Extension | Example                                                          |
| ------: | ------ | ---------------- | ---------------------------------------------------------------- |
|    none | gzip   | `.gz`            | `file.txt.gz`                                                    |
|    none | brotli | `.br`            | `file.txt.br`                                                    |
|     zip | none   | `.zip`           | `bundle.zip`                                                     |
|     zip | zip    | `.zip`           | `bundle.zip`                                                     |
|     tar | none   | `.tar`           | `bundle.tar`                                                     |
|     tar | gzip   | `.tar.gz`        | `bundle.tar.gz`                                                  |
|     tar | brotli | `.tar.br`        | `bundle.tar.br`                                                  |
|     zip | gzip   | `.zip.gz`        | `bundle.zip.gz` (**allowed**, but only if you truly double-wrap) |

## 🚀 Usage

### Basic File Extension Generation

```typescript
import { generateFileExtension } from '@/lib/utils/file-extensions'

// Single file with GZIP compression
const result = generateFileExtension({
  archive: 'none',
  compression: 'gzip',
  baseName: 'document.txt'
})
// Result: { extension: '.gz', fullName: 'document.txt.gz', description: 'Single file compressed with GZIP' }

// TAR archive with GZIP compression
const result = generateFileExtension({
  archive: 'tar',
  compression: 'gzip',
  baseName: 'bundle'
})
// Result: { extension: '.tar.gz', fullName: 'bundle.tar.gz', description: 'TAR archive compressed with GZIP' }
```

### Smart Filename Generation

```typescript
import { generateSmartFilename } from '@/lib/utils/file-extensions'

// Generate filename with timestamp
const filename = generateSmartFilename('document.txt', {
  archive: 'none',
  compression: 'gzip',
  timestamp: true
})
// Result: 'document.txt.gz-1703123456789'

// Generate archive filename
const filename = generateSmartFilename('bundle', {
  archive: 'tar',
  compression: 'brotli',
  timestamp: false
})
// Result: 'bundle.tar.br'
```

### Parse Existing Filenames

```typescript
import { parseFileExtension } from '@/lib/utils/file-extensions'

// Parse a filename to understand its structure
const result = parseFileExtension('bundle.tar.gz')
// Result: {
//   baseName: 'bundle',
//   archive: 'tar',
//   compression: 'gzip',
//   description: 'TAR archive compressed with GZIP'
// }
```

### Get Supported Extensions

```typescript
import { getSupportedExtensions } from '@/lib/utils/file-extensions'

// Get all supported extension patterns
const supported = getSupportedExtensions()
// Returns array of all supported archive + compression combinations
```

## 🔧 Integration Examples

### In Upload Components

```typescript
// Update filename based on compression settings
const updateFilename = (files: File[], compressionAlgo: string) => {
  if (files.length === 1) {
    // Single file: use compression algorithm extension
    const newFileName = generateSmartFilename(files[0].name, {
      archive: 'none',
      compression: compressionAlgo,
      timestamp: false
    })
    setFileName(newFileName)
  } else {
    // Multiple files: use archive format
    const newFileName = generateSmartFilename('bundle', {
      archive: 'zip',
      compression: 'none',
      timestamp: false
    })
    setFileName(newFileName)
  }
}
```

### In Compression Pipeline

```typescript
// Generate appropriate filename for compressed output
const generateOutputFilename = (inputName: string, options: ProcessOptions) => {
  const archive = options.archive?.algo || 'none'
  const compression = options.compression?.algo || 'none'
  
  return generateSmartFilename(inputName, {
    archive,
    compression,
    timestamp: true
  })
}
```

### In File Management

```typescript
// Determine file type from extension
const getFileInfo = (filename: string) => {
  const parsed = parseFileExtension(filename)
  
  if (parsed.archive === 'tar' && parsed.compression === 'gzip') {
    // Handle .tar.gz files
    return { type: 'tar-gzip', needsExtraction: true }
  } else if (parsed.archive === 'none' && parsed.compression === 'brotli') {
    // Handle .br files
    return { type: 'brotli', needsDecompression: true }
  }
  
  return { type: 'unknown', needsProcessing: false }
}
```

## 🎨 UI Components

### FileExtensionDemo Component

A complete demo component is available at `src/components/FileExtensionDemo.tsx` that showcases:

- **Extension Pattern Table**: Complete reference of all supported combinations
- **Filename Generator**: Interactive tool to generate filenames
- **Filename Parser**: Tool to parse existing filenames
- **Examples**: Common use cases and their results

### Demo Page

Access the interactive demo at `/file-extensions` to test the naming convention system.

## 🧪 Testing

### Test Script

Run the test script to verify the naming convention works correctly:

```bash
node scripts/test-file-extensions.js
```

This script tests:
- File extension generation for all combinations
- Filename parsing for various extensions
- Smart filename generation with options
- Supported extensions list
- Edge case handling

### Manual Testing

1. Navigate to `/file-extensions`
2. Try different archive and compression combinations
3. Generate filenames and verify extensions
4. Parse existing filenames to understand their structure

## 🔍 Implementation Details

### Core Functions

- **`generateFileExtension()`**: Core logic for extension generation
- **`parseFileExtension()`**: Reverse operation to parse existing filenames
- **`generateSmartFilename()`**: High-level function with additional options
- **`validateFilenameConvention()`**: Validate if filenames follow convention
- **`getSupportedExtensions()`**: Get complete list of supported patterns

### Type Safety

All functions are fully typed with TypeScript interfaces:

```typescript
export type CompressionAlgo = 'gzip' | 'brotli' | 'zip'
export type ArchiveAlgo = 'zip' | 'tar'

export interface FileExtensionOptions {
  archive: ArchiveAlgo | 'none'
  compression: CompressionAlgo | 'none'
  baseName: string
}
```

### Error Handling

Functions include comprehensive error handling:

- Invalid algorithm combinations
- Empty or malformed filenames
- Unsupported archive/compression pairs

## 🚀 Future Enhancements

### Planned Features

- **Custom Extension Mapping**: Allow users to define custom naming patterns
- **Internationalization**: Support for different naming conventions by locale
- **Extension Validation**: Real-time validation of generated filenames
- **Batch Processing**: Generate multiple filenames at once

### Integration Points

- **Upload Pipeline**: Automatic filename generation during file uploads
- **Compression API**: Consistent naming across all compression operations
- **File Browser**: Parse and display file types based on extensions
- **Download Manager**: Generate appropriate filenames for downloads

## 📝 Contributing

When adding new archive types or compression algorithms:

1. Update the `ArchiveAlgo` or `CompressionAlgo` types
2. Add new extension patterns to `generateFileExtension()`
3. Update parsing logic in `parseFileExtension()`
4. Add test cases to the test script
5. Update this documentation

## 🔗 Related Documentation

- [Compression Pipeline](./compression-pipeline.md)
- [WASM Integration](./wasm-integration.md)
- [File Management](./file-management.md)
- [API Reference](./api-reference.md)
