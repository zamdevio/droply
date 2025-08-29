# @droply/web

🌐 **Web-optimized Droply SDK with WASM compression and archive support**

A high-performance, browser-focused SDK for compression and archiving using WebAssembly. Built on top of the core `@droply/sdk` with web-specific optimizations.

## ✨ Features

- 🚀 **High Performance**: WebAssembly-powered compression and archiving
- 📱 **Mobile Optimized**: Automatic device detection and optimization
- 🔋 **Power Aware**: Battery status monitoring for mobile devices
- 🌊 **Streaming Support**: Process large files without blocking the UI
- 🎯 **Smart Caching**: Automatic WASM module caching
- 📦 **Multiple Formats**: Gzip, Brotli, ZIP, TAR support
- 🔧 **Bundler Ready**: Works with Webpack, Vite, Rollup, Next.js

## 📦 Installation

```bash
npm install @droply/web
# or
yarn add @droply/web
# or
pnpm add @droply/web
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { compress, decompress, createArchive } from '@droply/web';

// Compress data
const compressed = await compress(data, 'gzip', 9);

// Decompress data
const decompressed = await decompress(compressed, 'gzip');

// Create archive
const archive = await createArchive(files, 'zip', { compressInside: true });
```

### Advanced Usage

```typescript
import { droply, getOptimizedProcessingOptions } from '@droply/web';

// Get device-optimized settings
const options = await getOptimizedProcessingOptions();
console.log('Optimal compression level:', options.compressionLevel);

// Process files with streaming
const result = await droply.processFilesStreaming(
  files,
  { compression: { level: options.compressionLevel } },
  (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  }
);
```

## 🔧 Bundler Configuration

### Next.js

```javascript
// next.config.js
const { nextConfig } = require('@droply/web/bundler.config.js');

module.exports = nextConfig;
```

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { viteConfig } from '@droply/web/bundler.config.js';

export default defineConfig(viteConfig);
```

### Webpack

```javascript
// webpack.config.js
import { webpackConfig } from '@droply/web/bundler.config.js';

export default webpackConfig;
```

### Rollup

```javascript
// rollup.config.js
import { rollupConfig } from '@droply/web/bundler.config.js';

export default rollupConfig;
```

## 📱 Device Optimization

The SDK automatically detects device capabilities and optimizes accordingly:

```typescript
import { getDeviceRecommendations, getBatteryStatus } from '@droply/web';

// Get device-specific recommendations
const recommendations = getDeviceRecommendations();
console.log('Use Web Workers:', recommendations.useWebWorkers);

// Check battery status (mobile only)
const battery = await getBatteryStatus();
if (battery?.powerMode === 'low') {
  // Use lower compression for battery saving
}
```

## 🌊 Streaming for Large Files

Process large files without blocking the UI:

```typescript
import { processFilesStreaming } from '@droply/web';

const result = await processFilesStreaming(
  largeFileList,
  { compression: { level: 6 } },
  (progress) => {
    // Update progress bar
    updateProgressBar(progress.percentage);
    
    // Check if user wants to cancel
    if (shouldCancel) {
      throw new Error('User cancelled');
    }
  }
);
```

## 🔍 Browser Capabilities

Check what your browser supports:

```typescript
import { getWasmCapabilities, isWasmSupported } from '@droply/web';

if (!isWasmSupported()) {
  console.error('WebAssembly not supported');
  return;
}

const capabilities = getWasmCapabilities();
console.log('Streaming support:', capabilities.streaming);
console.log('Threads support:', capabilities.threads);
```

## 📚 API Reference

### Core Functions

- `compress(data, algorithm, level?)` - Compress data
- `decompress(data, algorithm)` - Decompress data
- `createArchive(files, format, options?)` - Create archive
- `extractArchive(data, format)` - Extract archive
- `listArchive(data, format)` - List archive contents

### Utility Functions

- `getSupportedAlgorithms()` - Get available algorithms
- `getOptimizedProcessingOptions()` - Get device-optimized settings
- `getDeviceRecommendations()` - Get device-specific recommendations
- `getBatteryStatus()` - Get battery status (mobile)
- `getBrowserMetrics()` - Get browser performance metrics

### WASM Management

- `preloadAllWasm()` - Preload all WASM modules
- `loadCompressionWasm(algorithm)` - Load specific compression WASM
- `loadArchiveWasm(format)` - Load specific archive WASM

## 🎯 Supported Algorithms

### Compression
- **Gzip** (`.gz`) - Levels 0-9
- **Brotli** (`.br`) - Levels 0-11  
- **ZIP** (`.zip`) - Store/deflate compression

### Archives
- **ZIP** (`.zip`) - With compression support
- **TAR** (`.tar`) - Uncompressed archive

## 🔒 Browser Support

- ✅ Chrome 57+
- ✅ Firefox 52+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 Performance

- **Compression**: 2-10x faster than pure JavaScript
- **Memory**: Optimized for mobile devices
- **Battery**: Power-aware processing on mobile
- **Caching**: Automatic WASM module caching

## 🚨 Error Handling

```typescript
import { compress } from '@droply/web';

try {
  const result = await compress(data, 'gzip', 9);
} catch (error) {
  if (error.message.includes('WebAssembly')) {
    console.error('WASM not supported');
  } else if (error.message.includes('algorithm')) {
    console.error('Algorithm not supported');
  } else {
    console.error('Compression failed:', error);
  }
}
```

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Development mode
pnpm dev

# Pack for publishing
pnpm pack
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please see our [contributing guide](../../CONTRIBUTING.md).

## 📞 Support

- 📧 Email: support@droply.io
- 🐛 Issues: [GitHub Issues](https://github.com/zamdevio/droply/issues)
- 📖 Docs: [docs.droply.io](https://docs.droply.io)
