# Droply Monorepo 🚀

Fast compression and archiving with WASM - cross-platform, SDK-ready, and CLI-powered.

## 🏗️ Architecture

```
droply/
├─ crates/                          # Rust source only (no build artifacts)
│  ├─ archive/{zip,tar}/
│  └─ compression/{zip,gzip,brotli}/
├─ packages/
│  ├─ sdk/                          # @droply/sdk (browser + node, typed)
│  ├─ cli/                          # @droply/cli (bin: droply)
│  └─ plugins/                      # runtime-loadable wasm builds + registry
├─ scripts/
│  ├─ build-wasm.sh                 # builds crates → packages/plugins/build/*
│  └─ conformance.sh                # run cross-tool tests
└─ tests/
    └─ conformance/                  # golden vectors + zip/tar/gzip/brotli comparisons
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **Rust** toolchain with **wasm-pack**
- **System tools** for conformance testing (unzip, gzip, tar)

### Install & Build

```bash
# Install dependencies
pnpm install

# Build WASM modules
pnpm build:wasm

# Build SDK and CLI packages
pnpm build:all

# Run conformance tests
pnpm test:conformance
```

### Use the CLI

```bash
# Compress a file
pnpm -C packages/cli exec droply compress input.txt --algo deflate --archive zip

# Decompress an archive
pnpm -C packages/cli exec droply decompress archive.zip

# List archive contents
pnpm -C packages/cli exec droply list archive.zip --json
```

### Use the SDK

```typescript
import { compress, decompress } from '@droply/sdk';

// Compress data
const result = await compress({
  input: new Uint8Array([...]),
  algo: 'deflate',
  archive: 'zip',
  level: 6
});

// Decompress archive
const files = await decompress({
  input: result.bytes
});
```

## 📦 Packages

### @droply/sdk
Cross-platform compression SDK with TypeScript support.

- **Browser**: WASM-powered with Web Worker support
- **Node.js**: Native streams + WASM fallback
- **Exports**: ESM + CJS with automatic environment detection

### @droply/cli
Command-line interface with pretty logging and progress bars.

- **Commands**: `compress`, `decompress`, `list`
- **Formats**: ZIP, TAR, GZIP, Brotli
- **Output**: Human-readable, JSON, verbose modes

### @droply/plugins
WASM module registry and runtime loader.

- **Modules**: Archive and compression WASM builds
- **Registry**: JSON manifest with module metadata
- **Loading**: Dynamic import with fallback chains

## 🔧 Development

### Build Commands

```bash
pnpm build:wasm      # Build Rust crates to WASM
pnpm build:sdk       # Build SDK package
pnpm build:cli       # Build CLI package
pnpm build:all       # Build everything
```

### Development Mode

```bash
pnpm dev:cli         # Watch CLI for changes
pnpm -C packages/sdk dev  # Watch SDK for changes
```

### Testing

```bash
pnpm test            # Run all tests
pnpm test:conformance # Run cross-tool verification
```

## 🎯 Roadmap

- [x] Monorepo structure with pnpm workspaces
- [x] SDK with environment-aware exports
- [x] CLI with pretty logging and progress bars
- [x] Plugin system for WASM modules
- [x] Conformance testing framework
- [ ] WASM module integration (currently mock implementations)
- [ ] Python wrapper (maturin)
- [ ] Next.js example app
- [ ] Performance benchmarks
- [ ] CI/CD pipeline

## 📚 API Reference

### Compression Options

```typescript
interface CompressOpts {
  input: Uint8Array | ArrayBuffer | ReadableStream<Uint8Array>;
  algo: 'deflate' | 'gzip' | 'brotli';
  archive?: 'zip' | 'tar' | null;
  level?: number;               // 0-11, clamped per algorithm
  filenames?: string[];         // for multi-file inputs
  compressInside?: boolean;     // archive entries compressed vs outer-only
  onProgress?: (p: {bytes: number; total?: number}) => void;
}
```

### Decompression Options

```typescript
interface DecompressOpts {
  input: Uint8Array | ArrayBuffer | ReadableStream<Uint8Array>;
  formatHint?: { 
    archive?: 'zip' | 'tar', 
    algo?: 'gzip' | 'brotli' | 'deflate' 
  };
  onProgress?: (p: {bytes: number; total?: number}) => void;
}
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** with conformance suite
5. **Submit** a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Droply** - Because compression should be fast, portable, and developer-friendly. 🚀
