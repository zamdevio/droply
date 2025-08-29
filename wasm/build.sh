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
OUT_BUNDLER="$OUT_BASE/bundler"
OUT_NODE="$OUT_BASE/nodejs"
OUT_WEB="$OUT_BASE/web"
REGISTRY_FILE="$OUT_BASE/registry.json"
BUILD_INFO_FILE="$OUT_BASE/build-info.json"

# Build settings
BUNDLER_TARGET="bundler"
NODE_TARGET="nodejs"
WEB_TARGET="web"
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
        if wasm-pack build --target "$target" "$BUILD_MODE" \
            --out-dir "$abs_out_dir" \
            --out-name "$OUTPUT_NAME" \
            "$crate_path"; then
            echo -e "    ${GREEN}✅ Built $crate_name for $target -> $out_dir${NC}"
        else
            echo -e "    ${RED}❌ Failed to build $crate_name for $target${NC}"
            echo -e "    ${YELLOW}⚠️  Check the Cargo.toml at: $crate_path/Cargo.toml${NC}"
            return 1
        fi
    else
        if wasm-pack build --target "$target" "$BUILD_MODE" \
            --out-dir "$abs_out_dir" \
            --out-name "$OUTPUT_NAME" \
            "$crate_path" > /dev/null 2>&1; then
            echo -e "    ${GREEN}✅ Built $crate_name for $target -> $out_dir${NC}"
        else
            echo -e "    ${RED}❌ Failed to build $crate_name for $target${NC}"
            echo -e "    ${YELLOW}⚠️  Check the Cargo.toml at: $crate_path/Cargo.toml${NC}"
            return 1
        fi
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
    local out_dir="$2"
    local target_name="$3"
    
    echo -e "${BLUE}🔧 Building $target_name crates for $target...${NC}"
    
    # Discover plugin types dynamically
    local plugin_types=($(discover_plugin_types "$CRATES_DIR"))
    
    local successful_crates=()
    local failed_crates=()
    
    # Build each plugin type
    for plugin_type in "${plugin_types[@]}"; do
        echo -e "  ${BLUE}Building $plugin_type plugins...${NC}"
        
        # Get all crates of this type
        local type_dir="$CRATES_DIR/$plugin_type"
        if [ ! -d "$type_dir" ]; then
            echo -e "    ${YELLOW}⚠️  No $plugin_type directory found${NC}"
            continue
        fi
        
        # Build each crate in this type
        for crate_dir in "$type_dir"/*; do
            if [ ! -d "$crate_dir" ]; then
                continue
            fi
            
            local crate_name=$(basename "$crate_dir")
            local crate_path="$crate_dir"
            local out_path="$out_dir/$plugin_type/$crate_name"
            
            # Build the crate
            if build_crate "$crate_path" "$plugin_type:$crate_name" "$out_path" "$target"; then
                successful_crates+=("$plugin_type:$crate_name")
            else
                failed_crates+=("$plugin_type:$crate_name")
            fi
        done
    done
    
    # Report results
    if [ ${#successful_crates[@]} -gt 0 ]; then
        echo -e "  ${GREEN}✅ Successfully built: ${successful_crates[*]}${NC}"
    fi
    
    if [ ${#failed_crates[@]} -gt 0 ]; then
        echo -e "  ${RED}❌ Failed to build: ${failed_crates[*]}${NC}"
        echo -e "  ${YELLOW}💡 Check the Cargo.toml files for these crates${NC}"
    fi
    
    return ${#failed_crates[@]}
}

# Function to generate registry.json using Cargo.toml metadata
generate_registry_from_cargo() {
    echo -e "${YELLOW}📋 Generating plugin registry from Cargo.toml metadata...${NC}"
    
    # Check if Python and toml package are available
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 not found. Cannot parse Cargo.toml metadata.${NC}"
        echo -e "${YELLOW}   Falling back to basic registry generation...${NC}"
        generate_registry
        return
    fi
    
    # Check if toml package is available
    if ! python3 -c "import toml" 2>/dev/null; then
        echo -e "${YELLOW}📦 Installing Python toml package...${NC}"
        pip3 install toml
    fi
    
    # Use our Cargo.toml parser to generate registry
    local registry_data
    local parser_output
    local parser_errors
    
    if parser_output=$(python3 "$WASM_DIR/scripts/parse-cargo.py" "$CRATES_DIR" 2>&1); then
        # Extract the JSON output (everything after the last line that starts with "📊")
        registry_data=$(echo "$parser_output" | sed -n '/^{/,/^}/p')
        
        # Add build timestamp
        registry_data=$(echo "$registry_data" | sed 's/"generated_at": null/"generated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"/')
        
        # Write to registry file
        echo "$registry_data" > "$REGISTRY_FILE"
        
        echo -e "  ${GREEN}✅ Generated registry from Cargo.toml metadata${NC}"
        
        # Show discovered extensions
        local extensions=$(echo "$registry_data" | python3 -c "
import sys, json
data = json.load(sys.stdin)
exts = list(data.get('extensions', {}).keys())
print(', '.join(exts) if exts else 'none')
")
        echo -e "  ${BLUE}📁 Discovered file extensions: ${extensions}${NC}"
        
        # Show any warnings from the parser
        if echo "$parser_output" | grep -q "⚠️"; then
            echo -e "  ${YELLOW}⚠️  Parser warnings:${NC}"
            echo "$parser_output" | grep "⚠️\|❌\|💡" | while read -r line; do
                echo -e "    $line"
            done
        fi
        
    else
        echo -e "${YELLOW}⚠️  Cargo.toml parsing failed, falling back to basic registry...${NC}"
        echo -e "${YELLOW}   Parser output:${NC}"
        echo "$parser_output" | while read -r line; do
            echo -e "     $line"
        done
        generate_registry
    fi
}

# Function to generate basic registry.json (fallback)
generate_registry() {
    echo -e "${YELLOW}📋 Generating basic plugin registry...${NC}"
    
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
        
        # Web plugins
        echo -e "${GREEN}Web (Browser):${NC}"
        for plugin_type in "${plugin_types[@]}"; do
            if [ -d "$OUT_WEB/$plugin_type" ] && [ "$(ls -A "$OUT_WEB/$plugin_type" 2>/dev/null)" ]; then
                local plugins=$(ls "$OUT_WEB/$plugin_type" | sort | uniq | tr '\n' ', ' | sed 's/, *$//')
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

# Function to generate dual-publish structure for plugins
generate_dual_publish_structure() {
    echo -e "${YELLOW}📦 Generating dual-publish structure for plugins...${NC}"
    
    # Check if Python is available
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 not found. Cannot generate dual-publish structure.${NC}"
        return 1
    fi
    
    # Create the new dist/ structure
    local dist_dir="$OUT_BASE/dist"
    echo -e "  ${BLUE}Creating dist/ directory structure...${NC}"
    
    # Create platform directories
    mkdir -p "$dist_dir"/{nodejs,web,bundler}/{compression,archive}
    
    # Copy built plugins to the new structure
    echo -e "  ${BLUE}Copying plugins to dist/ structure...${NC}"
    
    # Copy bundler plugins (web platform)
    if [ -d "$OUT_BUNDLER" ]; then
        for plugin_type in compression archive; do
            if [ -d "$OUT_BUNDLER/$plugin_type" ]; then
                for plugin in "$OUT_BUNDLER/$plugin_type"/*; do
                    if [ -d "$plugin" ]; then
                        local plugin_name=$(basename "$plugin")
                        local target_dir="$dist_dir/web/$plugin_type/$plugin_name"
                        mkdir -p "$target_dir"
                        
                        # Copy essential files
                        if [ -f "$plugin/module.js" ]; then
                            cp "$plugin/module.js" "$target_dir/index.js"
                        fi
                        if [ -f "$plugin/module.d.ts" ]; then
                            cp "$plugin/module.d.ts" "$target_dir/index.d.ts"
                        fi
                        if [ -f "$plugin/module_bg.wasm" ]; then
                            cp "$plugin/module_bg.wasm" "$target_dir/plugin.wasm"
                        fi
                        if [ -f "$plugin/plugin.json" ]; then
                            cp "$plugin/plugin.json" "$target_dir/plugin.json"
                        fi
                        
                        echo -e "    ${GREEN}✅ Copied $plugin_type/$plugin_name to web platform${NC}"
                    fi
                done
            fi
        done
    fi
    
    # Copy node plugins
    if [ -d "$OUT_NODE" ]; then
        for plugin_type in compression archive; do
            if [ -d "$OUT_NODE/$plugin_type" ]; then
                for plugin in "$OUT_NODE/$plugin_type"/*; do
                    if [ -d "$plugin" ]; then
                        local plugin_name=$(basename "$plugin")
                        local target_dir="$dist_dir/nodejs/$plugin_type/$plugin_name"
                        mkdir -p "$target_dir"
                        
                        # Copy essential files
                        if [ -f "$plugin/module.js" ]; then
                            cp "$plugin/module.js" "$target_dir/index.js"
                        fi
                        if [ -f "$plugin/module.d.ts" ]; then
                            cp "$plugin/module.d.ts" "$target_dir/index.d.ts"
                        fi
                        if [ -f "$plugin/module_bg.wasm" ]; then
                            cp "$plugin/module_bg.wasm" "$target_dir/plugin.wasm"
                        fi
                        if [ -f "$plugin/plugin.json" ]; then
                            cp "$plugin/plugin.json" "$target_dir/plugin.json"
                        fi
                        
                        echo -e "    ${GREEN}✅ Copied $plugin_type/$plugin_name to nodejs platform${NC}"
                    fi
                done
            fi
        done
    fi
    
    # Copy web plugins (web platform)
    if [ -d "$OUT_WEB" ]; then
        for plugin_type in compression archive; do
            if [ -d "$OUT_WEB/$plugin_type" ]; then
                for plugin in "$OUT_WEB/$plugin_type"/*; do
                    if [ -d "$plugin" ]; then
                        local plugin_name=$(basename "$plugin")
                        local target_dir="$dist_dir/web/$plugin_type/$plugin_name"
                        mkdir -p "$target_dir"
                        
                        # Copy essential files
                        if [ -f "$plugin/module.js" ]; then
                            cp "$plugin/module.js" "$target_dir/index.js"
                        fi
                        if [ -f "$plugin/module.d.ts" ]; then
                            cp "$plugin/module.d.ts" "$target_dir/index.d.ts"
                        fi
                        if [ -f "$plugin/module_bg.wasm" ]; then
                            cp "$plugin/module_bg.wasm" "$target_dir/plugin.wasm"
                        fi
                        if [ -f "$plugin/plugin.json" ]; then
                            cp "$plugin/plugin.json" "$target_dir/plugin.json"
                        fi
                        
                        echo -e "    ${GREEN}✅ Copied $plugin_type/$plugin_name to web platform${NC}"
                    fi
                done
            fi
        done
    fi
    
    # Copy bundler plugins (bundler platform - same as web but separate)
    if [ -d "$OUT_BUNDLER" ]; then
        for plugin_type in compression archive; do
            if [ -d "$OUT_BUNDLER/$plugin_type" ]; then
                for plugin in "$OUT_BUNDLER/$plugin_type"/*; do
                    if [ -d "$plugin" ]; then
                        local plugin_name=$(basename "$plugin")
                        local target_dir="$dist_dir/bundler/$plugin_type/$plugin_name"
                        mkdir -p "$target_dir"
                        
                        # Copy essential files
                        if [ -f "$plugin/module.js" ]; then
                            cp "$plugin/module.js" "$target_dir/index.js"
                        fi
                        if [ -f "$plugin/module.d.ts" ]; then
                            cp "$plugin/module.d.ts" "$target_dir/index.d.ts"
                        fi
                        if [ -f "$plugin/module_bg.wasm" ]; then
                            cp "$plugin/module_bg.wasm" "$target_dir/plugin.wasm"
                        fi
                        if [ -f "$plugin/plugin.json" ]; then
                            cp "$plugin/plugin.json" "$target_dir/plugin.json"
                        fi
                        
                        echo -e "    ${GREEN}✅ Copied $plugin_type/$plugin_name to bundler platform${NC}"
                    fi
                done
            fi
        done
    fi
    
    echo -e "  ${GREEN}✅ Plugin files copied to dist/ structure${NC}"
    return 0
}

# Function to generate exports and plugin packages
generate_exports_and_packages() {
    echo -e "${YELLOW}📋 Generating exports and plugin packages...${NC}"
    
    # Check if Python is available
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 not found. Cannot generate exports and packages.${NC}"
        return 1
    fi
    
    # Generate exports and REGISTRY.json
    echo -e "  ${BLUE}Generating exports and REGISTRY.json...${NC}"
    if python3 "$WASM_DIR/scripts/gen_exports.py"; then
        echo -e "    ${GREEN}✅ Generated exports and REGISTRY.json${NC}"
    else
        echo -e "    ${RED}❌ Failed to generate exports${NC}"
        return 1
    fi
    
    # Generate individual plugin package.json files
    echo -e "  ${BLUE}Generating individual plugin package.json files...${NC}"
    if python3 "$WASM_DIR/scripts/gen_plugin_packages.py"; then
        echo -e "    ${GREEN}✅ Generated individual plugin package.json files${NC}"
    else
        echo -e "    ${RED}❌ Failed to generate plugin packages${NC}"
        return 1
    fi
    
    echo -e "  ${GREEN}✅ Exports and plugin packages generated successfully!${NC}"
    return 0
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

# Build for web target (Browser/Web)
build_all_crates "$WEB_TARGET" "$OUT_WEB" "Browser/Web"

# Build for node target (Server-side)
build_all_crates "$NODE_TARGET" "$OUT_NODE" "Node.js/Server"

# Generate registry and build info
generate_registry_from_cargo
generate_build_info

# Generate dual-publish structure for plugins
echo -e "\n${BLUE}📦 Setting up dual-publish structure...${NC}"

# Step 1: Copy built plugins to dist/ structure
if generate_dual_publish_structure; then
    echo -e "${GREEN}✅ Plugin files copied to dist/ structure${NC}"
    
    # Step 2: Generate exports and individual plugin packages
    if generate_exports_and_packages; then
        echo -e "${GREEN}✅ Dual-publish structure ready!${NC}"
        echo -e "${BLUE}   Users can now:${NC}"
        echo -e "${BLUE}   - Install umbrella: npm install @droply/plugins${NC}"
        echo -e "${BLUE}   - Install individual: npm install @droply/plugins-nodejs-compression-gzip${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to generate exports and packages${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Failed to copy plugins to dist/ structure${NC}"
fi

# Validate builds
echo -e "${YELLOW}🔍 Validating builds...${NC}"
total_plugins=$(validate_builds)

echo -e "${GREEN}✅ WASM build complete!${NC}"
echo -e "Bundler modules: ${BLUE}$OUT_BUNDLER${NC}"
echo -e "Web modules: ${BLUE}$OUT_WEB${NC}"
echo -e "Node modules: ${BLUE}$OUT_NODE${NC}"
echo -e "Registry: ${BLUE}$REGISTRY_FILE${NC}"

# Show summary
show_summary $total_plugins
