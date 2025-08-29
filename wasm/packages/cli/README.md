# @droply/cli

Command-line interface for Droply compression and archive operations.

## 🚀 Installation

### Global Installation
```bash
npm install -g @droply/cli
```

### Local Installation
```bash
npm install @droply/cli
npx droply --help
```

## 📦 What's Included

This CLI provides command-line access to:

- **Compression**: Gzip, Brotli, ZIP algorithms
- **Archiving**: TAR, ZIP archive formats
- **File operations**: Compress, decompress, archive, extract
- **Batch processing**: Handle multiple files at once

## 🔧 Usage

### Basic Commands

```bash
# Show help
droply --help

# Compress a file
droply compress input.txt --algo gzip --level 9 --output output.gz

# Decompress a file
droply decompress input.gz --algo gzip --output output.txt

# Create archive
droply archive file1.txt file2.txt --format zip --output archive.zip

# Extract archive
droply extract archive.zip --output extracted/
```

### Compression Operations

#### Compress File
```bash
# Basic compression
droply compress input.txt --algo gzip

# With compression level
droply compress input.txt --algo brotli --level 11

# Specify output file
droply compress input.txt --algo gzip --output compressed.gz

# Compress multiple files
droply compress file1.txt file2.txt --algo gzip --output compressed/
```

#### Decompress File
```bash
# Basic decompression
droply decompress input.gz --algo gzip

# Specify output file
droply decompress input.gz --algo gzip --output decompressed.txt

# Decompress to directory
droply decompress input.gz --algo gzip --output ./decompressed/
```

### Archive Operations

#### Create Archive
```bash
# Create ZIP archive
droply archive file1.txt file2.txt --format zip --output archive.zip

# Create TAR archive
droply archive file1.txt file2.txt --format tar --output archive.tar

# With compression
droply archive file1.txt file2.txt --format zip --compression gzip --output archive.zip

# Archive directory
droply archive ./folder/ --format zip --output folder.zip
```

#### Extract Archive
```bash
# Extract ZIP
droply extract archive.zip --output ./extracted/

# Extract TAR
droply extract archive.tar --output ./extracted/

# Extract to current directory
droply extract archive.zip
```

### Advanced Options

#### Verbose Output
```bash
droply compress input.txt --algo gzip --verbose
```

#### JSON Output
```bash
droply compress input.txt --algo gzip --json
```

#### Progress Bar
```bash
droply compress large-file.txt --algo gzip --progress
```

#### Overwrite Files
```bash
droply compress input.txt --algo gzip --force
```

## 📚 Command Reference

### Global Options

```
Options:
  -V, --version     Show version number
  -h, --help        Show help
  -v, --verbose     Enable verbose output
  -q, --quiet       Suppress output
  --json            Output in JSON format
  --progress        Show progress bar
  --force           Overwrite existing files
```

### Compress Command

```
Usage: droply compress <files...> [options]

Arguments:
  files              Input files to compress

Options:
  -a, --algo        Compression algorithm (gzip, brotli, zip)
  -l, --level       Compression level (1-11 for gzip/brotli, 0-9 for zip)
  -o, --output      Output file or directory
  --format          Archive format (zip, tar) if creating archive
  --compression     Compression algorithm for archive
```

### Decompress Command

```
Usage: droply decompress <file> [options]

Arguments:
  file               Input file to decompress

Options:
  -a, --algo        Compression algorithm (gzip, brotli, zip)
  -o, --output      Output file or directory
  --format          Archive format (zip, tar) if extracting archive
```

### Archive Command

```
Usage: droply archive <files...> [options]

Arguments:
  files              Input files to archive

Options:
  -f, --format      Archive format (zip, tar)
  -c, --compression Compression algorithm (gzip, brotli, zip)
  -o, --output      Output archive file
  --recursive       Include subdirectories
```

### Extract Command

```
Usage: droply extract <archive> [options]

Arguments:
  archive            Archive file to extract

Options:
  -o, --output      Output directory
  --format          Archive format (auto-detected if not specified)
  --list            List archive contents without extracting
```

## 🧪 Examples

### File Compression Examples

```bash
# Compress a text file with gzip
droply compress document.txt --algo gzip --level 9 --output document.txt.gz

# Compress multiple files to a directory
droply compress *.txt --algo brotli --level 11 --output compressed/

# Compress with progress bar
droply compress large-video.mp4 --algo gzip --progress --output video.gz
```

### Archive Examples

```bash
# Create a ZIP archive of multiple files
droply archive file1.txt file2.txt file3.txt --format zip --output project.zip

# Create a compressed TAR archive
droply archive ./project/ --format tar --compression gzip --output project.tar.gz

# Archive with recursive directory inclusion
droply archive ./project/ --format zip --recursive --output project-full.zip
```

### Batch Processing Examples

```bash
# Compress all .txt files in current directory
droply compress *.txt --algo gzip --output compressed/

# Extract all .zip files in current directory
for file in *.zip; do
  droply extract "$file" --output "./extracted-${file%.zip}/"
done
```

### Integration Examples

```bash
# Compress and archive in one pipeline
droply compress large-file.txt --algo gzip | \
droply archive - --format tar --output archive.tar

# Extract and decompress
droply extract archive.tar.gz --output ./temp/ && \
droply decompress ./temp/*.gz --algo gzip --output ./final/
```

## 🔄 Exit Codes

- **0**: Success
- **1**: General error
- **2**: Invalid arguments
- **3**: File not found
- **4**: Permission denied
- **5**: Unsupported format

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **Runtime**: CommonJS support required
- **Dependencies**: @droply/sdk and @droply/plugins

## ⚡ Performance

- **WASM-powered**: Near-native performance
- **Streaming**: Efficient memory usage for large files
- **Parallel**: Multi-threaded processing where possible

## 🔒 Security

- **Input validation**: Comprehensive file path sanitization
- **Sandboxed**: WASM runs in isolated environment
- **Memory-safe**: Rust guarantees prevent vulnerabilities

## 🚨 Troubleshooting

### Common Issues

#### "Command not found"
```bash
# Ensure global installation
npm install -g @droply/cli

# Or use npx
npx droply --help
```

#### "Permission denied"
```bash
# Check file permissions
ls -la input.txt

# Use sudo if needed (not recommended)
sudo droply compress input.txt --algo gzip
```

#### "Unsupported format"
```bash
# Check supported algorithms
droply --help

# Use auto-detection
droply decompress file.gz
```

#### "Output file exists"
```bash
# Use --force to overwrite
droply compress input.txt --algo gzip --force

# Or specify different output
droply compress input.txt --algo gzip --output new-file.gz
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your CLI commands
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🔗 Related Packages

- **[@droply/sdk](../sdk/README.md)** - TypeScript SDK for compression operations
- **[@droply/plugins](../plugins/README.md)** - WASM compression and archive plugins
- **[Main Repository](https://github.com/droply/droply)** - Source code and documentation
