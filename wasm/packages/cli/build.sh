#!/bin/bash
set -e

# 🚀 Production-Ready WASM Build Script
# Automatically discovers and builds all compression and archive crates for multiple platforms

# ===== COMMAND LINE ARGUMENTS =====
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [-v|--verbose] [-h|--help]"
            echo "  -v, --verbose    Show wasm-pack build output"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# ===== CONFIGURATION VARIABLES =====
# Update these paths as needed - all paths are within the wasm folder
WASM_DIR="$(dirname "$0")"
CRATES_DIR="$WASM_DIR/crates"
OUT_BASE="$WASM_DIR/packages/plugins"
OUT_BUNDLER="$OUT_BASE/build"
OUT_NODE="$OUT_BASE/build-node"
REGISTRY_FILE="$OUT_BASE/registry.json"
BUILD_INFO_FILE="$OUT_BASE/build-info.json"

# Build settings
BUNDLER_TARGET="bundler"
NODE_TARGET="nodejs"
BUILD_MODE="--release"
OUTPUT_NAME="module"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===== BUILD FUNCTIONS =====

# Function to build a single crate for a specific target
build_crate() {
    local crate_path="$1"
    local crate_name="$2"
    local out_dir="$3"
    local target="$4"
    
    echo -e "  Building ${GREEN}$crate_name${NC} for ${BLUE}$target${NC}..."
    
    # Create the output directory
    mkdir -p "$out_dir"
    
    # Convert relative path to absolute path for wasm-pack
    local abs_out_dir="$(realpath "$out_dir")"
    
    # Build with wasm-pack using absolute path
    if [ "$VERBOSE" = true ]; then
        wasm-pack build --target "$target" "$BUILD_MODE" \
            --out-dir "$abs_out_dir" \
            --out-name "$OUTPUT_NAME" \
            "$crate_path"
    else
        wasm-pack build --target "$target" "$BUILD_MODE" \
            --out-dir "$abs_out_dir" \
            --out-name "$OUTPUT_NAME" \
            "$crate_path" > /dev/null 2>&1
    fi
    
    # Generate plugin manifest
    local plugin_type=$(echo "$crate_name" | cut -d: -f1)
    local module_name=$(echo "$crate_name" | cut -d: -f2)
    
    cat > "$out_dir/plugin.json" << EOF
{
  "name": "@droply/wasm-$plugin_type-$module_name",
  "version": "1.0.0",
  "target": "$target",
  "wasm": "./module_bg.wasm",
  "entry": "./module.js",
  "exports": ["compress", "decompress", "version"],
  "meta": { "minSdk": "1.0.0" }
}
EOF
    
    echo -e "    ${GREEN}✅ Built $crate_name for $target -> $out_dir${NC}"
}

# Function to discover plugin types dynamically
discover_plugin_types() {
    local crates_dir="$1"
    local plugin_types=()
    
    # Look for any subdirectories in crates that could be plugin types
    for type_dir in "$crates_dir"/*; do
        if [ -d "$type_dir" ] && [ "$type_dir" != "$crates_dir/*" ]; then
            local type_name=$(basename "$type_dir")
            # Check if it contains any valid crates
            for crate in "$type_dir"/*; do
                if [ -d "$crate" ] && [ -f "$crate/Cargo.toml" ]; then
                    plugin_types+=("$type_name")
                    break
                fi
            done
        fi
    done
    
    echo "${plugin_types[@]}"
}

# Function to build all crates for a specific target
build_all_crates() {
    local target="$1"
    local out_base="$2"
    local target_name="$3"
    
    echo -e "${YELLOW}🔧 Building $target_name crates for $target...${NC}"
    
    # Discover plugin types dynamically
    local plugin_types=($(discover_plugin_types "$CRATES_DIR"))
    
    if [ ${#plugin_types[@]} -eq 0 ]; then
        echo -e "  ${YELLOW}⚠️  No plugin types found in $CRATES_DIR${NC}"
        return
    fi
    
    # Build each plugin type
    for plugin_type in "${plugin_types[@]}"; do
        echo -e "  ${BLUE}Building $plugin_type plugins...${NC}"
        
        # Create output directory for this plugin type
        mkdir -p "$out_base/$plugin_type"
        
        # Build crates of this type
        for module in $(ls "$CRATES_DIR/$plugin_type" 2>/dev/null || echo ""); do
            local crate_path="$CRATES_DIR/$plugin_type/$module"
            if [ -d "$crate_path" ] && [ -f "$crate_path/Cargo.toml" ]; then
                local crate_name="$plugin_type:$module"
                local out_dir="$out_base/$plugin_type/$module"
                
                build_crate "$crate_path" "$crate_name" "$out_dir" "$target"
            fi
        done
    done
}

# Function to generate registry.json
generate_registry() {
    echo -e "${YELLOW}📋 Generating plugin registry...${NC}"
    
    # Discover plugin types dynamically
    local plugin_types=($(discover_plugin_types "$CRATES_DIR"))
    
    cat > "$REGISTRY_FILE" << EOF
{
  "version": 1,
  "modules": [
EOF
    
    local first_entry=true
    
    # Add plugins to registry for each plugin type
    for plugin_type in "${plugin_types[@]}"; do
        if [ -d "$OUT_BUNDLER/$plugin_type" ]; then
            for module in $(ls "$OUT_BUNDLER/$plugin_type" 2>/dev/null || echo ""); do
                if [ -f "$OUT_BUNDLER/$plugin_type/$module/plugin.json" ]; then
                    if [ "$first_entry" = true ]; then
                        first_entry=false
                    else
                        echo "," >> "$REGISTRY_FILE"
                    fi
                    cat >> "$REGISTRY_FILE" << EOF
    { "kind": "$plugin_type", "name": "$module", "path": "./build/$plugin_type/$module/module.js", "manifest": "./build/$plugin_type/$module/plugin.json" }
EOF
                fi
            done
        fi
    done
    
    # Close registry JSON
    cat >> "$REGISTRY_FILE" << EOF
  ]
}
EOF
}

# Function to generate build info
generate_build_info() {
    echo -e "${YELLOW}📋 Generating build information...${NC}"
    
    # Discover plugin types dynamically
    local plugin_types=($(discover_plugin_types "$CRATES_DIR"))
    
    # Calculate totals for each target
    local bundler_total=0
    local node_total=0
    
    for plugin_type in "${plugin_types[@]}"; do
        if [ -d "$OUT_BUNDLER/$plugin_type" ]; then
            bundler_total=$((bundler_total + $(ls "$OUT_BUNDLER/$plugin_type" 2>/dev/null | wc -l)))
        fi
        if [ -d "$OUT_NODE/$plugin_type" ]; then
            node_total=$((node_total + $(ls "$OUT_NODE/$plugin_type" 2>/dev/null | wc -l)))
        fi
    done
    
    cat > "$BUILD_INFO_FILE" << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "rustVersion": "$(rustc --version 2>/dev/null || echo 'unknown')",
  "wasmPackVersion": "$(wasm-pack --version 2>/dev/null || echo 'unknown')",
  "pluginTypes": [$(printf '"%s"' "${plugin_types[0]}" && printf ', "%s"' "${plugin_types[@]:1}")],
  "targets": {
    "bundler": {
      "totalPlugins": $bundler_total,
      "pluginTypes": {
$(for plugin_type in "${plugin_types[@]}"; do
  local count=$(ls "$OUT_BUNDLER/$plugin_type" 2>/dev/null | wc -l)
  echo "        \"$plugin_type\": $count"
done | sed '$!s/$/,/')
      }
    },
    "node": {
      "totalPlugins": $node_total,
      "pluginTypes": {
$(for plugin_type in "${plugin_types[@]}"; do
  local count=$(ls "$OUT_NODE/$plugin_type" 2>/dev/null | wc -l)
  echo "        \"$plugin_type\": $count"
done | sed '$!s/$/,/')
      }
    }
  }
}
EOF
}

# Function to validate builds
validate_builds() {
    local total_plugins=0
    
    # Discover plugin types dynamically
    local plugin_types=($(discover_plugin_types "$CRATES_DIR"))
    
    if [ ${#plugin_types[@]} -eq 0 ]; then
        echo -e "  ${YELLOW}⚠️  No plugin types found to validate${NC}" >&2
        echo $total_plugins
        return
    fi
    
    echo -e "  ${BLUE}Validating Bundler Plugins:${NC}" >&2
    
    # Validate bundler builds for each plugin type
    for plugin_type in "${plugin_types[@]}"; do
        if [ -d "$OUT_BUNDLER/$plugin_type" ]; then
            for plugin_dir in "$OUT_BUNDLER/$plugin_type"/*; do
                if [ -d "$plugin_dir" ] && [ "$plugin_dir" != "$OUT_BUNDLER/$plugin_type/*" ]; then
                    if [ -f "$plugin_dir/module_bg.wasm" ] && [ -f "$plugin_dir/module.js" ]; then
                        echo -e "    ${GREEN}✅ $plugin_type: $(basename "$plugin_dir")${NC}" >&2
                        ((total_plugins++))
                    else
                        echo -e "    ${RED}❌ $plugin_type: $(basename "$plugin_dir") - missing required files${NC}" >&2
                    fi
                fi
            done
        fi
    done
    
    echo -e "  ${BLUE}Validating Node.js Plugins:${NC}" >&2
    
    # Validate node builds for each plugin type
    for plugin_type in "${plugin_types[@]}"; do
        if [ -d "$OUT_NODE/$plugin_type" ]; then
            for plugin_dir in "$OUT_NODE/$plugin_type"/*; do
                if [ -d "$plugin_dir" ] && [ "$plugin_dir" != "$OUT_NODE/$plugin_type/*" ]; then
                    if [ -f "$plugin_dir/module_bg.wasm" ] && [ -f "$plugin_dir/module.js" ]; then
                        echo -e "    ${GREEN}✅ $plugin_type: $(basename "$plugin_dir")${NC}" >&2
                        ((total_plugins++))
                    else
                        echo -e "    ${RED}❌ $plugin_type: $(basename "$plugin_dir") - missing required files${NC}" >&2
                    fi
                fi
            done
        fi
    done
    
    echo $total_plugins
}

# Function to show plugin summary
show_summary() {
    local total_plugins="$1"
    
    if [ $total_plugins -gt 0 ]; then
        echo -e "\n${BLUE}📊 Plugin Summary:${NC}"
        
        # Discover plugin types dynamically
        local plugin_types=($(discover_plugin_types "$CRATES_DIR"))
        
        # Bundler plugins
        echo -e "${GREEN}Bundler (Next.js/Web):${NC}"
        for plugin_type in "${plugin_types[@]}"; do
            if [ -d "$OUT_BUNDLER/$plugin_type" ] && [ "$(ls -A "$OUT_BUNDLER/$plugin_type" 2>/dev/null)" ]; then
                local plugins=$(ls "$OUT_BUNDLER/$plugin_type" | sort | uniq | tr '\n' ', ' | sed 's/, *$//')
                echo -e "  ${plugin_type^}: ${plugins}"
            else
                echo -e "  ${plugin_type^}: (none)"
            fi
        done
        
        # Node plugins
        echo -e "${GREEN}Node.js (Server):${NC}"
        for plugin_type in "${plugin_types[@]}"; do
            if [ -d "$OUT_NODE/$plugin_type" ] && [ "$(ls -A "$OUT_NODE/$plugin_type" 2>/dev/null)" ]; then
                local plugins=$(ls "$OUT_NODE/$plugin_type" | sort | uniq | tr '\n' ', ' | sed 's/, *$//')
                echo -e "  ${plugin_type^}: ${plugins}"
            else
                echo -e "  ${plugin_type^}: (none)"
            fi
        done
        
        # Total count
        echo -e "\n${BLUE}Total Plugins Built: ${GREEN}$total_plugins${NC}"
        
        # Future-ready message
        echo -e "\n${YELLOW}💡 To add new plugins:${NC}"
        echo -e "  1. Create a new crate in crates/[type]/[name]/"
        echo -e "  2. Ensure it has a valid Cargo.toml"
        echo -e "  3. Run this build script again"
        echo -e "  4. New plugin types are automatically discovered!"
        
    else
        echo -e "\n${YELLOW}⚠️  No plugins were built successfully${NC}"
        echo -e "\n${YELLOW}🔍 Troubleshooting:${NC}"
        echo -e "  1. Check that crates have valid Cargo.toml files"
        echo -e "  2. Ensure Rust and wasm-pack are installed"
        echo -e "  3. Check for compilation errors in individual crates"
    fi
}

# ===== MAIN BUILD LOGIC =====
cd "$WASM_DIR"

echo -e "${BLUE}🚀 Building Droply WASM SDK for multiple platforms...${NC}"

# Check dependencies
if ! command -v wasm-pack &> /dev/null; then
    echo -e "${YELLOW}📦 Installing wasm-pack...${NC}"
    cargo install wasm-pack
fi

if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Cargo not found. Please install Rust: https://rustup.rs/${NC}"
    exit 1
fi

# Clean previous builds
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
rm -rf "$OUT_BUNDLER" "$OUT_NODE"

# Discover plugin types and create build directories
echo -e "${BLUE}🔍 Discovering plugin types...${NC}"
plugin_types=($(discover_plugin_types "$CRATES_DIR"))

if [ ${#plugin_types[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No plugin types found in $CRATES_DIR${NC}"
    echo -e "${YELLOW}   Make sure you have crates with valid Cargo.toml files${NC}"
    exit 1
fi

echo -e "${GREEN}Found plugin types: ${plugin_types[*]}${NC}"

# Create build directories for each plugin type
for plugin_type in "${plugin_types[@]}"; do
    mkdir -p "$OUT_BUNDLER/$plugin_type" "$OUT_NODE/$plugin_type"
done

# Build for bundler target (Next.js/Web)
build_all_crates "$BUNDLER_TARGET" "$OUT_BUNDLER" "Next.js/Web"

# Build for node target (Server-side)
build_all_crates "$NODE_TARGET" "$OUT_NODE" "Node.js/Server"

# Generate registry and build info
generate_registry
generate_build_info

# Validate builds
echo -e "${YELLOW}🔍 Validating builds...${NC}"
total_plugins=$(validate_builds)

echo -e "${GREEN}✅ WASM build complete!${NC}"
echo -e "Bundler modules: ${BLUE}$OUT_BUNDLER${NC}"
echo -e "Node modules: ${BLUE}$OUT_NODE${NC}"
echo -e "Registry: ${BLUE}$REGISTRY_FILE${NC}"

# Show summary
show_summary $total_plugins
