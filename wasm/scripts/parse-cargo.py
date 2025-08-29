#!/usr/bin/env python3
"""
🎯 Cargo.toml Parser for Droply Build System
Automatically extracts metadata from Cargo.toml files to generate registry.json
"""

import os
import sys
import json
import toml
from pathlib import Path
from typing import Dict, List, Any, Optional

def parse_cargo_toml(cargo_path: Path) -> Optional[Dict[str, Any]]:
    """Parse a Cargo.toml file and extract droply metadata."""
    try:
        with open(cargo_path, 'r', encoding='utf-8') as f:
            cargo_data = toml.load(f)
        
        # Check if this crate has droply metadata
        if 'package' not in cargo_data or 'metadata' not in cargo_data['package']:
            return None
        
        metadata = cargo_data['package']['metadata']
        if 'droply' not in metadata:
            return None
        
        droply_meta = metadata['droply']
        
        # Extract basic info
        result = {
            'name': cargo_data['package']['name'],
            'version': cargo_data['package']['version'],
            'type': droply_meta.get('type'),
            'extensions': droply_meta.get('extensions', []),
            'description': droply_meta.get('description', ''),
            'features': droply_meta.get('features', []),
        }
        
        # Extract algorithm-specific info for compression
        if result['type'] == 'compression':
            result['algorithm'] = droply_meta.get('algorithm')
            result['compression_levels'] = droply_meta.get('compression_levels', {})
        
        # Extract format-specific info for archives
        elif result['type'] == 'archive':
            result['format'] = droply_meta.get('format')
        
        return result
        
    except Exception as e:
        print(f"⚠️  Warning: Could not parse {cargo_path}: {e}", file=sys.stderr)
        return None

def discover_crates(crates_dir: Path) -> Dict[str, List[Dict[str, Any]]]:
    """Discover all crates and their metadata."""
    crates = {'compression': [], 'archive': []}
    failed_crates = []
    
    for crate_type in ['compression', 'archive']:
        type_dir = crates_dir / crate_type
        if not type_dir.exists():
            continue
            
        for crate_dir in type_dir.iterdir():
            if not crate_dir.is_dir():
                continue
                
            cargo_path = crate_dir / 'Cargo.toml'
            if not cargo_path.exists():
                continue
            
            metadata = parse_cargo_toml(cargo_path)
            if metadata:
                metadata['crate_path'] = str(crate_dir.relative_to(crates_dir))
                crates[crate_type].append(metadata)
            else:
                failed_crates.append(str(crate_dir.relative_to(crates_dir)))
    
    # Report failed crates
    if failed_crates:
        print(f"⚠️  Warning: Failed to parse metadata for {len(failed_crates)} crates:", file=sys.stderr)
        for failed in failed_crates:
            print(f"    ❌ {failed}/Cargo.toml", file=sys.stderr)
        print(f"💡 Check that these crates have valid [package.metadata.droply] sections", file=sys.stderr)
    
    return crates

def generate_registry_data(crates: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Generate registry data structure with platform support and detailed paths."""
    registry = {
        'version': 1,
        'platforms': {
            'nodejs': {
                'compression': {},
                'archives': {},
                'metadata': {
                    'generated_at': None,
                    'total_plugins': 0
                }
            },
            'bundler': {
                'compression': {},
                'archives': {},
                'metadata': {
                    'generated_at': None,
                    'total_plugins': 0
                }
            }
        },
        'metadata': {
            'generated_at': None,
            'total_plugins': 0
        }
    }
    
    total_plugins = 0
    
    # Process compression crates for each platform
    for crate in crates['compression']:
        algo = crate['algorithm']
        crate_path = crate.get('crate_path', '')
        
        # Node.js platform (WASM modules)
        nodejs_module = {
            'name': crate['name'],
            'version': crate['version'],
            'description': crate['description'],
            'extensions': crate['extensions'],
            'compression_levels': crate['compression_levels'],
            'paths': {
                'wasm': f'./compression/{algo}/module.js',
                'module': f'./compression/{algo}/package.json',
                'types': f'./compression/{algo}/index.d.ts'
            }
        }
        registry['platforms']['nodejs']['compression'][algo] = nodejs_module
        
        # Bundler platform (ES modules)
        bundler_module = {
            'name': crate['name'],
            'version': crate['version'],
            'description': crate['description'],
            'extensions': crate['extensions'],
            'compression_levels': crate['compression_levels'],
            'paths': {
                'wasm': f'./compression/{algo}/module.js',
                'module': f'./compression/{algo}/package.json',
                'types': f'./compression/{algo}/index.d.ts'
            }
        }
        registry['platforms']['bundler']['compression'][algo] = bundler_module
        
        total_plugins += 1
    
    # Process archive crates for each platform
    for crate in crates['archive']:
        format_name = crate['format']
        crate_path = crate.get('crate_path', '')
        
        # Node.js platform (WASM modules)
        nodejs_module = {
            'name': crate['name'],
            'version': crate['version'],
            'description': crate['description'],
            'extensions': crate['extensions'],
            'features': crate['features'],
            'paths': {
                'wasm': f'./archive/{format_name}/module.js',
                'module': f'./archive/{format_name}/package.json',
                'types': f'./archive/{format_name}/index.d.ts'
            }
        }
        registry['platforms']['nodejs']['archives'][format_name] = nodejs_module
        
        # Bundler platform (ES modules)
        bundler_module = {
            'name': crate['name'],
            'version': crate['version'],
            'description': crate['description'],
            'extensions': crate['extensions'],
            'features': crate['features'],
            'paths': {
                'wasm': f'./archive/{format_name}/module.js',
                'module': f'./archive/{format_name}/package.json',
                'types': f'./archive/{format_name}/index.d.ts'
            }
        }
        registry['platforms']['bundler']['archives'][format_name] = bundler_module
        
        total_plugins += 1
    
    # Update metadata for each platform
    for platform in registry['platforms']:
        platform_data = registry['platforms'][platform]
        platform_data['metadata']['total_plugins'] = total_plugins
        platform_data['metadata']['generated_at'] = None  # Will be set by build script
    
    registry['metadata']['total_plugins'] = total_plugins
    registry['metadata']['generated_at'] = None  # Will be set by build script
    
    return registry

def main():
    """Main function to parse crates and output registry data."""
    if len(sys.argv) != 2:
        print("Usage: python3 parse-cargo.py <crates_directory>")
        sys.exit(1)
    
    crates_dir = Path(sys.argv[1])
    if not crates_dir.exists():
        print(f"❌ Error: Crates directory {crates_dir} does not exist")
        sys.exit(1)
    
    print(f"🔍 Discovering crates in {crates_dir}...")
    
    # Discover all crates
    crates = discover_crates(crates_dir)
    
    # Generate registry data
    registry = generate_registry_data(crates)
    # Output as JSON
    print(json.dumps(registry, indent=2))
    
    # Print summary
    print(f"\n📊 Summary:")
    print(f"  Compression algorithms: {len(crates['compression'])}")
    print(f"  Archive formats: {len(crates['archive'])}")
    print(f"  Total plugins: {registry['metadata']['total_plugins']}")

if __name__ == '__main__':
    main()
