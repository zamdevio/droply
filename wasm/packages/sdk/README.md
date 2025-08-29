# @droply/sdk

High-performance compression and archive SDK with WASM-powered algorithms.

## 🚀 Installation

```bash
npm install @droply/sdk @droply/plugins
```

## 📦 What's Included

This SDK provides a unified TypeScript API for:

- **Compression**: Gzip, Brotli, ZIP algorithms
- **Archiving**: TAR, ZIP archive formats
- **Cross-platform**: Works in Node.js and browsers
- **Type-safe**: Full TypeScript support

## 🔧 Usage

### Basic Compression

```typescript
import { compress, decompress } from '@droply/sdk';

// Compress data
const input = Buffer.from('Hello, World!');
const { bytes, meta } = await compress({
  input,
  algo: 'gzip',
  level: 6
});

// Decompress data
const decompressed = await decompress({
  input: bytes,
  algo: 'gzip'
});
```

### Archive Operations

```typescript
import { createArchive, extractArchive } from '@droply/sdk';

// Create archive
const files = [
  { name: 'file1.txt', content: Buffer.from('Hello') },
  { name: 'file2.txt', content: Buffer.from('World') }
];

const archive = await createArchive({
  files,
  format: 'zip',
  compression: 'gzip'
});

// Extract archive
const extracted = await extractArchive({
  input: archive,
  format: 'zip'
});
```

### Browser Usage

```typescript
import { compress } from '@droply/sdk';

// In browser environment
const input = new TextEncoder().encode('Hello, World!');
const { bytes, meta } = await compress({
  input,
  algo: 'brotli',
  level: 11
});
```

## 📚 API Reference

### Compression Functions

#### `compress(options: CompressOptions): Promise<CompressResult>`

Compresses input data using the specified algorithm.

```typescript
interface CompressOptions {
  input: Buffer | Uint8Array;
  algo: 'gzip' | 'brotli' | 'zip';
  level?: number; // 1-11 for gzip/brotli, 0-9 for zip
  archive?: 'zip' | 'tar' | null;
}

interface CompressResult {
  bytes: Buffer | Uint8Array;
  meta: DroplyMeta;
}
```

#### `decompress(options: DecompressOptions): Promise<DecompressResult>`

Decompresses previously compressed data.

```typescript
interface DecompressOptions {
  input: Buffer | Uint8Array;
  algo: 'gzip' | 'brotli' | 'zip';
  archive?: 'zip' | 'tar' | null;
}

interface DecompressResult {
  bytes: Buffer | Uint8Array;
  meta: DroplyMeta;
}
```

### Archive Functions

#### `createArchive(options: CreateArchiveOptions): Promise<ArchiveResult>`

Creates an archive containing multiple files.

```typescript
interface CreateArchiveOptions {
  files: ArchiveFile[];
  format: 'zip' | 'tar';
  compression?: 'gzip' | 'brotli' | 'zip' | null;
}

interface ArchiveFile {
  name: string;
  content: Buffer | Uint8Array;
  size?: number;
  modified?: Date;
}

interface ArchiveResult {
  bytes: Buffer | Uint8Array;
  meta: DroplyMeta;
}
```

#### `extractArchive(options: ExtractArchiveOptions): Promise<ExtractResult>`

Extracts files from an archive.

```typescript
interface ExtractArchiveOptions {
  input: Buffer | Uint8Array;
  format: 'zip' | 'tar';
}

interface ExtractResult {
  files: ArchiveFile[];
  meta: DroplyMeta;
}
```

### Metadata

#### `DroplyMeta`

```typescript
interface DroplyMeta {
  algorithm: string;
  compressionLevel: number;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  timestamp: Date;
  environment: {
    platform: 'node' | 'browser';
    version: string;
    wasmVersion: string;
  };
}
```

## 🔄 Platform Support

### Node.js
- **Target**: CommonJS and ESM
- **Path**: `./dist/node.js`
- **Features**: Full Buffer support, file system operations

### Browser/ESM
- **Target**: ESM only
- **Path**: `./dist/web.js`
- **Features**: Uint8Array support, web-optimized

## ⚡ Performance

- **WASM-powered**: Near-native performance
- **Zero-copy**: Efficient memory usage
- **Optimized**: Built with Rust and optimized with `wasm-opt`
- **Async**: Non-blocking operations

## 🔒 Security

- **Sandboxed**: WASM runs in isolated environment
- **Memory-safe**: Rust guarantees prevent common vulnerabilities
- **Input validation**: Comprehensive input sanitization

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **Browsers**: Modern browsers with WASM support
- **Runtime**: ESM support required

## 🧪 Examples

### File Compression

```typescript
import { compress, decompress } from '@droply/sdk';
import { readFileSync, writeFileSync } from 'fs';

// Compress file
const input = readFileSync('large-file.txt');
const { bytes } = await compress({
  input,
  algo: 'gzip',
  level: 9
});

writeFileSync('large-file.txt.gz', bytes);

// Decompress file
const compressed = readFileSync('large-file.txt.gz');
const { bytes: decompressed } = await decompress({
  input: compressed,
  algo: 'gzip'
});

writeFileSync('decompressed-file.txt', decompressed);
```

### Stream Processing

```typescript
import { createReadStream, createWriteStream } from 'fs';
import { Transform } from 'stream';
import { compress } from '@droply/sdk';

class CompressTransform extends Transform {
  constructor(algo = 'gzip', level = 6) {
    super();
    this.algo = algo;
    this.level = level;
    this.buffer = Buffer.alloc(0);
  }

  async _transform(chunk, encoding, callback) {
    try {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      const { bytes } = await compress({
        input: this.buffer,
        algo: this.algo,
        level: this.level
      });
      this.push(bytes);
      this.buffer = Buffer.alloc(0);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    if (this.buffer.length > 0) {
      this.push(this.buffer);
    }
    callback();
  }
}

// Usage
createReadStream('input.txt')
  .pipe(new CompressTransform('gzip', 9))
  .pipe(createWriteStream('output.gz'));
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🔗 Related Packages

- **[@droply/plugins](../plugins/README.md)** - WASM compression and archive plugins
- **[@droply/cli](../cli/README.md)** - Command-line interface
- **[Main Repository](https://github.com/droply/droply)** - Source code and documentation
