# 🚀 Publishing Guide for @droply Packages

This guide explains how to publish the Droply WASM packages to npm.

## 📋 Prerequisites

1. **npm Account**: You must have an npm account and be logged in
2. **Organization Access**: You must have access to the `@droply` organization on npm
3. **Git Clean**: Your working directory must be clean (no uncommitted changes)
4. **Node.js**: Version 18.0.0 or higher

## 🔐 Setup

### 1. Login to npm
```bash
npm login
```

### 2. Verify Organization Access
```bash
npm whoami
npm org ls droply
```

### 3. Ensure Clean Git State
```bash
git status
# Should show "working tree clean"
```

## 🏗️ Building Packages

### Manual Build
```bash
# Build WASM modules
npm run build

# Build TypeScript packages
npm run build:all
```

### Automated Build
```bash
# Build everything in one command
npm run build:all
```

## ✅ Validation

Before publishing, validate all packages:

```bash
npm run validate
```

This checks:
- ✅ Required files exist (README.md, LICENSE, package.json)
- ✅ Build directories contain expected files
- ✅ WASM modules are properly built
- ✅ No forbidden files are included

## 📦 Package Inspection

Create tarballs to inspect what will be published:

```bash
npm run pack
```

This creates `.tgz` files for each package so you can verify contents.

## 🚀 Publishing

### Automated Publishing (Recommended)

```bash
npm run publish
```

This script:
1. 🔨 Builds all packages
2. 🔍 Validates package contents
3. 📦 Creates inspection tarballs
4. 🚀 Publishes to npm in correct order

### Manual Publishing

If you prefer manual control:

```bash
# 1. Build and validate
npm run build:all
npm run validate

# 2. Publish in dependency order
npm publish -w @droply/plugins --access public
npm publish -w @droply/sdk --access public
npm publish -w @droply/cli --access public
```

## 📊 Package Structure

### What Gets Published

#### @droply/plugins
```
✅ build/           # Browser/ESM builds
✅ build-node/      # Node.js builds
✅ registry.json    # Plugin metadata
✅ README.md        # Documentation
✅ LICENSE          # License file
✅ package.json     # Package manifest
```

#### @droply/sdk
```
✅ dist/            # Compiled TypeScript
✅ README.md        # Documentation
✅ LICENSE          # License file
✅ package.json     # Package manifest
```

#### @droply/cli
```
✅ dist/            # Compiled CLI binary
✅ README.md        # Documentation
✅ LICENSE          # License file
✅ package.json     # Package manifest
```

### What Stays Private

```
❌ src/             # TypeScript source
❌ crates/          # Rust source code
❌ scripts/         # Build scripts
❌ tests/           # Test files
❌ .github/         # CI configuration
❌ node_modules/    # Dependencies
```

## 🔄 Version Management

### Bumping Versions

```bash
# Patch version (bug fixes)
npm version patch -w @droply/plugins
npm version patch -w @droply/sdk
npm version patch -w @droply/cli

# Minor version (new features)
npm version minor -w @droply/plugins
npm version minor -w @droply/sdk
npm version minor -w @droply/cli

# Major version (breaking changes)
npm version major -w @droply/plugins
npm version major -w @droply/sdk
npm version major -w @droply/cli
```

### Version Alignment

Keep versions aligned across packages when:
- WASM ABI changes
- SDK API changes
- Breaking changes occur

## 🏷️ Release Tags

### Pre-releases
```bash
npm publish -w @droply/plugins --tag next
npm publish -w @droply/sdk --tag next
npm publish -w @droply/cli --tag next
```

### Stable releases
```bash
npm publish -w @droply/plugins --tag latest
npm publish -w @droply/sdk --tag latest
npm publish -w @droply/cli --tag latest
```

## 🧪 Testing After Publishing

### 1. Test Installation
```bash
# Create test directory
mkdir test-install && cd test-install

# Install packages
npm install @droply/plugins @droply/sdk

# Test basic functionality
node -e "
import('@droply/plugins/compression/gzip').then(async (gzip) => {
  await gzip.default();
  console.log('✅ Gzip plugin loaded successfully');
});
"
```

### 2. Verify Package Contents
```bash
npm pack @droply/plugins
tar -tzf droply-plugins-*.tgz | head -20
rm droply-plugins-*.tgz
```

## 🚨 Troubleshooting

### Common Issues

#### "Package already exists"
```bash
# Bump version
npm version patch -w @droply/plugins
npm version patch -w @droply/sdk
npm version patch -w @droply/cli
```

#### "Access denied"
```bash
# Check organization access
npm org ls droply

# Ensure you're logged in
npm whoami
```

#### "Build failed"
```bash
# Clean and rebuild
npm run clean
npm run build:all
```

#### "Validation failed"
```bash
# Check missing files
ls -la packages/plugins/
ls -la packages/sdk/
ls -la packages/cli/

# Ensure all required files exist
```

## 📚 Post-Publishing

### 1. Update Documentation
- Update main README with installation instructions
- Create release notes on GitHub
- Update any external documentation

### 2. Announce Release
- Create GitHub release
- Update changelog
- Notify community

### 3. Monitor
- Check npm download statistics
- Monitor for issues
- Gather feedback

## 🔮 Future Improvements

- [ ] Automated CI/CD pipeline
- [ ] Automated testing before publish
- [ ] Size monitoring and alerts
- [ ] Dependency vulnerability scanning
- [ ] Automated changelog generation

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Review the validation output
3. Check npm organization permissions
4. Open an issue on GitHub

---

**Happy Publishing! 🎉**
