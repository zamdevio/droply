#!/bin/bash

# Droply Plugins Publishing Script Wrapper - Advanced Mode
# This script calls the Python publishing script with full argument support

set -e  # Exit on any error

# Colors for output
BLUE='\033[94m'
GREEN='\033[92m'
YELLOW='\033[93m'
RED='\033[91m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/scripts/publish-plugins.py"

# Function to show help
show_help() {
    echo -e "${BOLD}🚀 Droply Plugins Publishing Wrapper - Advanced Mode${NC}"
    echo "=========================================================="
    echo ""
    echo -e "${BOLD}Usage:${NC}"
    echo "  ./publish-plugins.sh [OPTIONS]"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  # Publish all plugins (default)"
    echo "  ./publish-plugins.sh"
    echo ""
    echo "  # Publish only Node.js plugins"
    echo "  ./publish-plugins.sh --platform nodejs"
    echo ""
    echo "  # Publish only compression plugins for bundler"
    echo "  ./publish-plugins.sh --platform bundler --kind compression"
    echo ""
    echo "  # Publish only gzip compression plugins"
    echo "  ./publish-plugins.sh --algo gzip"
    echo ""
    echo "  # Publish specific plugin"
    echo "  ./publish-plugins.sh --plugin @droply/plugins-nodejs-compression-gzip"
    echo ""
    echo "  # Dry run to see what would be published"
    echo "  ./publish-plugins.sh --platform web --dry-run"
    echo ""
    echo "  # Publish with specific version"
    echo "  ./publish-plugins.sh --version 2.1.0"
    echo ""
    echo -e "${BOLD}Run with --help for full options:${NC}"
    echo "  ./publish-plugins.sh --help"
}

# Check if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

echo -e "${BOLD}🚀 Droply Plugins Publishing Wrapper - Advanced Mode${NC}"
echo "=========================================================="

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo -e "${RED}❌ Publishing script not found: $PYTHON_SCRIPT${NC}"
    echo -e "${YELLOW}💡 Make sure you're running this from the wasm directory${NC}"
    exit 1
fi

# Check if dist directory exists (plugins built)
if [ ! -d "$SCRIPT_DIR/packages/plugins/dist" ]; then
    echo -e "${RED}❌ Plugins not built yet!${NC}"
    echo -e "${YELLOW}💡 Run ./build.sh first to build the plugins${NC}"
    exit 1
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    echo -e "${YELLOW}💡 Install Python 3 and try again${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo -e "${BLUE}📦 Starting plugin publishing process...${NC}"
echo ""

# Pass all arguments to the Python script
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}💡 No arguments provided. Publishing all plugins.${NC}"
    echo -e "${YELLOW}💡 Use --help for options or specific publishing targets.${NC}"
    echo ""
fi

# Run the Python publishing script with all arguments
python3 "$PYTHON_SCRIPT" "$@"

echo ""
echo -e "${GREEN}🎉 Publishing process completed!${NC}"
