#!/usr/bin/env python3
"""
🎯 Dual-Publish Exports Generator for Droply Plugins
Supports both subpath exports and individual package names
"""

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
PKG_JSON = ROOT / "package.json"
REGISTRY = ROOT / "REGISTRY.json"

def main():
    if not DIST.exists():
        print(f"[gen_exports] dist/ not found at {DIST}", file=sys.stderr)
        print(f"[gen_exports] Creating dist/ directory...", file=sys.stderr)
        DIST.mkdir(parents=True, exist_ok=True)
        
        # Create sample structure for testing
        create_sample_structure()
    
    # Load existing package.json
    if PKG_JSON.exists():
        with PKG_JSON.open("r", encoding="utf-8") as f:
            pkg = json.load(f)
    else:
        # Create new package.json if it doesn't exist
        pkg = create_base_package_json()

    exports = {}
    registry = []

    # dist/<platform>/<kind>/<algo>/index.js
    for platform in _subdirs(DIST):
        for kind in _subdirs(DIST / platform):
            for algo in _subdirs(DIST / platform / kind):
                base = DIST / platform / kind / algo
                js = base / "index.js"
                dts = base / "index.d.ts"
                wasm = base / "plugin.wasm"

                if not js.exists():
                    continue

                subpath = f"./{platform}/{kind}/{algo}"
                exp = {"default": str(js.relative_to(ROOT)).replace("\\", "/")}
                
                if dts.exists():
                    exp["types"] = str(dts.relative_to(ROOT)).replace("\\", "/")
                
                exports[subpath] = exp

                # Generate individual package name
                pkg_name = f"@droply/plugins-{platform}-{kind}-{algo}"
                
                registry.append({
                    "platform": platform,
                    "kind": kind,
                    "algo": algo,
                    "subpath": subpath,
                    "package": pkg_name,
                    "entry": subpath,
                    "files": {
                        "js": str(js.relative_to(ROOT)).replace("\\", "/"),
                        "types": str(dts.relative_to(ROOT)).replace("\\", "/") if dts.exists() else None,
                        "wasm": str(wasm.relative_to(ROOT)).replace("\\", "/") if wasm.exists() else None
                    }
                })

    # Write REGISTRY.json with new structure
    registry_data = {
        "version": 1,
        "plugins": sorted(registry, key=lambda x: (x["platform"], x["kind"], x["algo"]))
    }
    
    with REGISTRY.open("w", encoding="utf-8") as f:
        json.dump(registry_data, f, indent=2)

    # Update package.json exports
    pkg["exports"] = exports
    if "files" not in pkg:
        pkg["files"] = ["dist", "REGISTRY.json"]
    elif "REGISTRY.json" not in pkg["files"]:
        pkg["files"].append("REGISTRY.json")

    with PKG_JSON.open("w", encoding="utf-8") as f:
        json.dump(pkg, f, indent=2)
    
    print(f"[gen_exports] Wrote {len(exports)} exports and REGISTRY.json")
    print(f"[gen_exports] Exports: {list(exports.keys())}")
    print(f"[gen_exports] Registry plugins: {len(registry)}")
    
    # Show individual package names
    print(f"\n📦 Individual Package Names:")
    for plugin in registry:
        print(f"  {plugin['package']} -> {plugin['subpath']}")

def create_base_package_json():
    """Create a base package.json for the meta package."""
    return {
        "name": "@droply/plugins",
        "version": "0.1.0",
        "description": "High-performance WASM compression and archive plugins for Node.js and browsers",
        "type": "module",
        "sideEffects": False,
        "exports": {},
        "files": ["dist", "REGISTRY.json"],
        "keywords": [
            "wasm",
            "compression",
            "archive",
            "gzip",
            "brotli",
            "zip",
            "tar",
            "webassembly",
            "performance"
        ],
        "author": "ZamDev",
        "license": "MIT",
        "repository": {
            "type": "git",
            "url": "https://github.com/zamdevio/droply.git",
            "directory": "wasm/packages/plugins"
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
        },
        "scripts": {
            "pack": "npm pack",
            "gen-exports": "python3 scripts/gen_exports.py"
        }
    }

def create_sample_structure():
    """Create sample directory structure for testing."""
    sample_plugins = [
        "nodejs/compression/gzip",
        "nodejs/compression/brotli", 
        "nodejs/compression/zip",
        "nodejs/archive/tar",
        "nodejs/archive/zip",
        "web/compression/gzip",
        "web/compression/brotli",
        "web/compression/zip",
        "web/archive/tar",
        "web/archive/zip",
        "bundler/compression/gzip",
        "bundler/compression/brotli",
        "bundler/compression/zip",
        "bundler/archive/tar",
        "bundler/archive/zip"
    ]
    
    for plugin_path in sample_plugins:
        plugin_dir = DIST / plugin_path
        plugin_dir.mkdir(parents=True, exist_ok=True)
        
        # Create sample index.js
        js_file = plugin_dir / "index.js"
        js_file.write_text(f'// Sample plugin: {plugin_path}\nexport default {{ name: "{plugin_path}" }};')
        
        # Create sample index.d.ts
        dts_file = plugin_dir / "index.d.ts"
        dts_file.write_text(f'// Type definitions for {plugin_path}\nexport default interface {{ name: string }};')
        
        # Create sample plugin.wasm (empty file for now)
        wasm_file = plugin_dir / "plugin.wasm"
        wasm_file.write_text('')

def _subdirs(p: Path):
    """Get subdirectories of a path."""
    return [d.name for d in p.iterdir() if d.is_dir()]

if __name__ == "__main__":
    main()
