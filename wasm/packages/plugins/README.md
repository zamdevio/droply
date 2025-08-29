# @droply/plugins

High-performance WASM compression and archive plugins for Node.js and browsers.

## 🚀 Installation

```bash
npm install @droply/plugins
```

## 📦 What's Included

This package contains pre-compiled WebAssembly modules for:

### Compression Algorithms
- **Gzip** - Fast compression with good ratio
- **Brotli** - High compression ratio, slower but better compression
- **ZIP** - Archive format with compression

### Archive Formats
- **TAR** - Tape archive format
- **ZIP** - Archive format with compression

## 🔧 Usage

### Browser/Next.js (ESM)

```typescript
import init, { compress, decompress } from '@droply/plugins/compression/gzip';

// Initialize the WASM module
await init();

// Compress data
const input = new TextEncoder().encode('Hello, World!');
const compressed = compress(input, 6); // level 6 compression

// Decompress data
const decompressed = decompress(compressed);
const text = new TextDecoder().decode(decompressed);
```

### Node.js (CommonJS)

```typescript
import init, { compress, decompress } from '@droply/plugins/compression/gzip';

// Initialize the WASM module
await init();

// Compress Buffer
const input = Buffer.from('Hello, World!');
const compressed = compress(input, 6);

// Decompress Buffer
const decompressed = decompress(compressed);
```

## 📚 Available Plugins

### Compression Plugins

| Plugin | Browser Path | Node.js Path | Description |
|--------|--------------|--------------|-------------|
| Gzip | `@droply/plugins/compression/gzip` | `@droply/plugins/compression/gzip` | Fast compression with good ratio |
| Brotli | `@droply/plugins/compression/brotli` | `@droply/plugins/compression/brotli` | High compression ratio |
| ZIP | `@droply/plugins/compression/zip` | `@droply/plugins/compression/zip` | ZIP compression algorithm |

### Archive Plugins

| Plugin | Browser Path | Node.js Path | Description |
|--------|--------------|--------------|-------------|
| TAR | `@droply/plugins/archive/tar` | `@droply/plugins/archive/tar` | TAR archive format |
| ZIP | `@droply/plugins/archive/zip` | `@droply/plugins/archive/zip` | ZIP archive format |

## 🔄 Conditional Exports

The package automatically provides the right version for your environment:

- **Browser/ESM**: Uses `./build/` directory (bundler target)
- **Node.js**: Uses `./build-node/` directory (node target)

## 📁 Package Structure

```
@droply/plugins/
├── build/           # Browser/ESM builds
│   ├── compression/
│   │   ├── gzip/
│   │   ├── brotli/
│   │   └── zip/
│   └── archive/
│       ├── tar/
│       └── zip/
├── build-node/      # Node.js builds
│   ├── compression/
│   │   ├── gzip/
│   │   ├── brotli/
│   │   └── zip/
│   └── archive/
│       ├── tar/
│       └── zip/
└── registry.json    # Plugin metadata
```

## ⚡ Performance

- **WASM-powered**: Near-native performance
- **Zero-copy**: Efficient memory usage
- **Optimized**: Built with Rust and optimized with `wasm-opt`

## 🔒 Security

- **Sandboxed**: WASM runs in isolated environment
- **Memory-safe**: Rust guarantees prevent common vulnerabilities
- **Audited**: Open source with community review

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **Browsers**: Modern browsers with WASM support
- **Runtime**: ESM support required

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your plugin to `crates/`
4. Run `bash build.sh` to build
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🔗 Related Packages

- **[@droply/sdk](../sdk/README.md)** - TypeScript SDK for compression operations
- **[@droply/cli](../cli/README.md)** - Command-line interface
- **[Main Repository](https://github.com/droply/droply)** - Source code and documentation
