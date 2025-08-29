#!/usr/bin/env python3
"""
🎯 Individual Plugin Package.json Generator
Creates package.json files for each plugin with @droply/plugins-<platform>-<kind>-<algo> naming
"""

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

def generate_plugin_package_json(platform: str, kind: str, algo: str, plugin_dir: Path):
    """Generate package.json for an individual plugin."""
    
    # Generate package name
    package_name = f"@droply/plugins-{platform}-{kind}-{algo}"
    
    # Determine description based on type
    if kind == "compression":
        description = f"High-performance {algo.upper()} compression using WebAssembly for {platform}"
        keywords = [algo, "compression", "wasm", "webassembly", "performance"]
    else:  # archive
        description = f"High-performance {algo.upper()} archive format using WebAssembly for {platform}"
        keywords = [algo, "archive", "wasm", "webassembly", "performance"]
    
    # Create package.json content
    package_json = {
        "name": package_name,
        "version": "0.1.0",
        "description": description,
        "type": "module",
        "private": False,
        "main": "./module.js",
        "types": "./module.d.ts",
        "files": [
            "module.js",
            "module_bg.wasm",
            "module_bg.js",
            "module.d.ts",
            "plugin.json"
        ],
        "sideEffects": [
            "./module.js",
            "./snippets/*"
        ],
        "exports": {
            ".": {
                "default": "./module.js",
                "types": "./module.d.ts"
            }
        },
        "keywords": keywords,
        "author": "ZamDev",
        "license": "MIT",
        "repository": {
            "type": "git",
            "url": "https://github.com/zamdevio/droply.git",
            "directory": f"wasm/packages/plugins/{platform}/{kind}/{algo}"
        },
        "bugs": {
            "url": "https://github.com/zamdevio/droply/issues"
        },
        "homepage": "https://github.com/zamdevio/droply#readme",
        "publishConfig": {
            "access": "public"
        },
        "engines": {
            "node": ">=18.0.0"
        }
    }
    
    # Write package.json to plugin directory
    package_json_path = plugin_dir / "package.json"
    with package_json_path.open("w", encoding="utf-8") as f:
        json.dump(package_json, f, indent=2)
    
    print(f"✅ Generated {package_name} -> {package_json_path}")
    return package_name

def generate_plugin_json(platform: str, kind: str, algo: str, plugin_dir: Path):
    """Generate plugin.json metadata file."""
    
    plugin_data = {
        "name": f"droply-{kind}-{algo}",
        "version": "0.1.0",
        "type": kind,
        "platform": platform,
        "algorithm": algo if kind == "compression" else None,
        "format": algo if kind == "archive" else None,
        "description": f"{algo.upper()} {kind} plugin for {platform} platform",
        "files": {
            "module": "./module.js",
            "wasm": "./module_bg.wasm",
            "types": "./module.d.ts"
        },
        "capabilities": {
            "compression": kind == "compression",
            "archiving": kind == "archive",
            "metadata_embedding": True,
            "compress_inside": algo == "zip" and kind == "archive"
        }
    }
    
    # Add compression-specific info
    if kind == "compression":
        plugin_data["compression_levels"] = {
            "min": 0,
            "max": 9 if algo in ["gzip", "zip"] else 11,
            "default": 6
        }
        plugin_data["extensions"] = {
            "gzip": ["gz"],
            "brotli": ["br"],
            "zip": ["zip"]
        }.get(algo, [])
    
    # Add archive-specific info
    if kind == "archive":
        plugin_data["features"] = ["metadata-embedding"]
        if algo == "zip":
            plugin_data["features"].append("compress-inside")
        plugin_data["extensions"] = {
            "tar": ["tar"],
            "zip": ["zip"]
        }.get(algo, [])
    
    # Write plugin.json
    plugin_json_path = plugin_dir / "plugin.json"
    with plugin_json_path.open("w", encoding="utf-8") as f:
        json.dump(plugin_data, f, indent=2)
    
    print(f"✅ Generated plugin.json -> {plugin_json_path}")

def main():
    """Generate individual package.json files for all plugins."""
    
    if not DIST.exists():
        print(f"❌ Error: dist/ directory not found at {DIST}")
        print("💡 Run gen_exports.py first to create the dist structure")
        sys.exit(1)
    
    print("🎯 Generating individual plugin package.json files...\n")
    
    generated_packages = []
    
    # Process each platform/kind/algo combination
    for platform in ["nodejs", "web", "bundler"]:
        platform_dir = DIST / platform
        if not platform_dir.exists():
            continue
            
        for kind in ["compression", "archive"]:
            kind_dir = platform_dir / kind
            if not kind_dir.exists():
                continue
                
            for algo in kind_dir.iterdir():
                if not algo.is_dir():
                    continue
                    
                algo_name = algo.name
                plugin_dir = kind_dir / algo_name
                
                # Generate package.json
                package_name = generate_plugin_package_json(platform, kind, algo_name, plugin_dir)
                generated_packages.append(package_name)
                
                # Generate plugin.json
                generate_plugin_json(platform, kind, algo_name, plugin_dir)
                
                print(f"   └── {platform}/{kind}/{algo_name}")
                print()
    
    print(f"🎉 Generated {len(generated_packages)} individual plugin packages!")
    print("\n📦 Generated Packages:")
    for package in generated_packages:
        print(f"  {package}")
    
    print(f"\n💡 Each plugin can now be published individually with:")
    print(f"   npm publish --workspace={package}")
    print(f"\n🌐 Users can install individual plugins with:")
    print(f"   npm install {generated_packages[0]}")

if __name__ == "__main__":
    main()
