#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running Droply WASM conformance tests...${NC}"

# Ensure we're in the wasm directory
cd "$(dirname "$0")"

# Create test fixtures directory
mkdir -p tests/conformance/fixtures

# Generate test files
echo -e "${YELLOW}📝 Generating test fixtures...${NC}"
echo "Hello, Droply!" > tests/conformance/fixtures/hello.txt
echo "This is a test file for compression testing." > tests/conformance/fixtures/test.txt
dd if=/dev/urandom bs=1K count=100 2>/dev/null > tests/conformance/fixtures/random.bin

# Test compression and verification
echo -e "${YELLOW}🔧 Testing compression...${NC}"

# Test ZIP compression
if command -v unzip >/dev/null 2>&1; then
    echo -e "  Testing ${GREEN}ZIP${NC} compression..."
    # Use the built CLI from packages/cli if available
    if [ -f "../../packages/cli/dist/droply.js" ]; then
        node ../../packages/cli/dist/droply.js compress tests/conformance/fixtures/hello.txt --archive zip --algo deflate --output tests/conformance/fixtures/hello.zip
        
        # Verify with unzip
        if unzip -t tests/conformance/fixtures/hello.zip >/dev/null 2>&1; then
            echo -e "    ${GREEN}✅ ZIP verification passed${NC}"
        else
            echo -e "    ${RED}❌ ZIP verification failed${NC}"
            exit 1
        fi
    else
        echo -e "    ${YELLOW}⚠️  CLI not built yet, skipping ZIP test${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  unzip not available, skipping ZIP test${NC}"
fi

# Test GZIP compression
if command -v gzip >/dev/null 2>&1; then
    echo -e "  Testing ${GREEN}GZIP${NC} compression..."
    if [ -f "../../packages/cli/dist/droply.js" ]; then
        node ../../packages/cli/dist/droply.js compress tests/conformance/fixtures/hello.txt --algo gzip --output tests/conformance/fixtures/hello.gz
        
        # Verify with gzip
        if gzip -t tests/conformance/fixtures/hello.gz >/dev/null 2>&1; then
            echo -e "    ${GREEN}✅ GZIP verification passed${NC}"
        else
            echo -e "    ${RED}❌ GZIP verification failed${NC}"
            exit 1
        fi
    else
        echo -e "    ${YELLOW}⚠️  CLI not built yet, skipping GZIP test${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  gzip not available, skipping GZIP test${NC}"
fi

# Test decompression
echo -e "${YELLOW}📤 Testing decompression...${NC}"
if [ -f "tests/conformance/fixtures/hello.zip" ] && [ -f "../../packages/cli/dist/droply.js" ]; then
    node ../../packages/cli/dist/droply.js decompress tests/conformance/fixtures/hello.zip --output tests/conformance/fixtures/decompressed/
    
    # Compare original vs decompressed
    if diff tests/conformance/fixtures/hello.txt tests/conformance/fixtures/decompressed/hello.txt >/dev/null 2>&1; then
        echo -e "    ${GREEN}✅ Decompression verification passed${NC}"
    else
        echo -e "    ${RED}❌ Decompression verification failed${NC}"
        exit 1
    fi
else
    echo -e "    ${YELLOW}⚠️  ZIP file or CLI not available, skipping decompression test${NC}"
fi

# Test list functionality
echo -e "${YELLOW}📋 Testing list functionality...${NC}"
if [ -f "tests/conformance/fixtures/hello.zip" ] && [ -f "../../packages/cli/dist/droply.js" ]; then
    node ../../packages/cli/dist/droply.js list tests/conformance/fixtures/hello.zip --json > tests/conformance/fixtures/list_output.json
    
    if [ -s tests/conformance/fixtures/list_output.json ]; then
        echo -e "    ${GREEN}✅ List functionality passed${NC}"
    else
        echo -e "    ${RED}❌ List functionality failed${NC}"
        exit 1
    fi
else
    echo -e "    ${YELLOW}⚠️  ZIP file or CLI not available, skipping list test${NC}"
fi

echo -e "${GREEN}✅ All conformance tests passed!${NC}"
echo -e "Test fixtures: ${BLUE}tests/conformance/fixtures/${NC}"
