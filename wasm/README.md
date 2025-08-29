# Droply WASM SDK

High-performance compression and archive SDK built with WebAssembly and Rust.

## 🏗️ Project Structure

```
wasm/
├── packages/
│   ├── plugins/          # WASM compression and archive plugins
│   ├── sdk/             # TypeScript SDK for compression operations
│   └── cli/             # Command-line interface
├── crates/              # Rust source code for WASM modules
├── scripts/             # Build and validation scripts
└── build.sh            # Main build script for WASM modules
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust toolchain
- wasm-pack

### Installation

```bash
# Install dependencies
npm install

# Build WASM modules
npm run build

# Build all packages
npm run build:all
```

## 📦 Packages

### @droply/plugins
WASM compression and archive plugins for Node.js and browsers.

```bash
npm install @droply/plugins
```

### @droply/sdk
TypeScript SDK providing a unified API for compression operations.

```bash
npm install @droply/sdk
```

### @droply/cli
Command-line interface for compression and archive operations.

```bash
npm install -g @droply/cli
```

## 🔧 Development

```bash
# Build WASM modules
npm run build

# Build TypeScript packages
npm run build:sdk
npm run build:cli

# Validate all packages
npm run validate

# Clean build artifacts
npm run clean
```

## 📚 Documentation

- [Plugins Documentation](packages/plugins/README.md)
- [SDK Documentation](packages/sdk/README.md)
- [CLI Documentation](packages/cli/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build:all` to ensure everything builds
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
