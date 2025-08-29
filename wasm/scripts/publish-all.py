#!/usr/bin/env python3
"""
Droply Plugins Publishing Script
Publishes all individual plugins first, then the umbrella package.
"""

import json
import os
import sys
import subprocess
import time
from pathlib import Path
from typing import List, Dict, Any

# Configuration
ROOT = Path(__file__).resolve().parents[1]
PLUGINS_DIR = ROOT / "packages" / "plugins"
DIST_DIR = PLUGINS_DIR / "dist"
REGISTRY_FILE = PLUGINS_DIR / "REGISTRY.json"
UMBRELLA_PKG_JSON = PLUGINS_DIR / "package.json"

# Colors for output
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(message: str, color: str = Colors.BLUE):
    """Print colored log message"""
    print(f"{color}{message}{Colors.END}")

def log_success(message: str):
    """Print success message"""
    log(f"✅ {message}", Colors.GREEN)

def log_warning(message: str):
    """Print warning message"""
    log(f"⚠️  {message}", Colors.YELLOW)

def log_error(message: str):
    """Print error message"""
    log(f"❌ {message}", Colors.RED)

def log_info(message: str):
    """Print info message"""
    log(f"ℹ️  {message}", Colors.BLUE)

def run_command(cmd: List[str], cwd: Path = None, check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return the result"""
    log_info(f"Running: {' '.join(cmd)}")
    if cwd:
        log_info(f"Working directory: {cwd}")
    
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=check
        )
        return result
    except subprocess.CalledProcessError as e:
        log_error(f"Command failed: {' '.join(cmd)}")
        log_error(f"Error: {e}")
        if e.stdout:
            log_info(f"stdout: {e.stdout}")
        if e.stderr:
            log_error(f"stderr: {e.stderr}")
        raise

def check_npm_auth() -> bool:
    """Check if user is authenticated with npm"""
    try:
        result = run_command(["npm", "whoami"], check=False)
        if result.returncode == 0:
            username = result.stdout.strip()
            log_success(f"Authenticated as: {username}")
            return True
        else:
            log_error("Not authenticated with npm")
            log_info("Run: npm login")
            return False
    except Exception as e:
        log_error(f"Failed to check npm auth: {e}")
        return False

def load_registry() -> Dict[str, Any]:
    """Load the plugin registry"""
    if not REGISTRY_FILE.exists():
        log_error(f"Registry file not found: {REGISTRY_FILE}")
        sys.exit(1)
    
    with open(REGISTRY_FILE, 'r') as f:
        return json.load(f)

def get_plugin_packages() -> List[Dict[str, Any]]:
    """Get list of all plugin packages to publish"""
    registry = load_registry()
    return registry.get('plugins', [])

def update_plugin_versions(version: str):
    """Update version in all individual plugin package.json files"""
    log_info(f"Updating all plugin versions to {version}")
    
    for platform in ['nodejs', 'bundler', 'web']:
        platform_dir = DIST_DIR / platform
        if not platform_dir.exists():
            continue
            
        for kind in ['compression', 'archive']:
            kind_dir = platform_dir / kind
            if not kind_dir.exists():
                continue
                
            for plugin_dir in kind_dir.iterdir():
                if not plugin_dir.is_dir():
                    continue
                    
                pkg_json = plugin_dir / "package.json"
                if not pkg_json.exists():
                    continue
                
                # Update package.json version
                with open(pkg_json, 'r') as f:
                    pkg_data = json.load(f)
                
                old_version = pkg_data.get('version', 'unknown')
                pkg_data['version'] = version
                
                with open(pkg_json, 'w') as f:
                    json.dump(pkg_data, f, indent=2)
                
                plugin_name = pkg_data['name']
                log_success(f"Updated {plugin_name}: {old_version} → {version}")

def update_umbrella_version(version: str):
    """Update version in umbrella package.json"""
    log_info(f"Updating umbrella package version to {version}")
    
    with open(UMBRELLA_PKG_JSON, 'r') as f:
        pkg_data = json.load(f)
    
    old_version = pkg_data.get('version', 'unknown')
    pkg_data['version'] = version
    pkg_data['files'] = ["dist", "REGISTRY.json", "README.md", "LICENSE"]
    
    with open(UMBRELLA_PKG_JSON, 'w') as f:
        json.dump(pkg_data, f, indent=2)
    
    log_success(f"Updated umbrella package: {old_version} → {version}")

def publish_individual_plugins(version: str) -> List[str]:
    """Publish all individual plugins"""
    log_info("Publishing individual plugins...")
    
    published_plugins = []
    failed_plugins = []
    
    for platform in ['nodejs', 'bundler', 'web']:
        platform_dir = DIST_DIR / platform
        if not platform_dir.exists():
            continue
            
        for kind in ['compression', 'archive']:
            kind_dir = platform_dir / kind
            if not kind_dir.exists():
                continue
                
            for plugin_dir in kind_dir.iterdir():
                if not plugin_dir.is_dir():
                    continue
                    
                pkg_json = plugin_dir / "package.json"
                if not pkg_json.exists():
                    continue
                
                with open(pkg_json, 'r') as f:
                    pkg_data = json.load(f)
                
                plugin_name = pkg_data['name']
                plugin_version = pkg_data['version']
                
                log_info(f"Publishing {plugin_name} v{plugin_version}...")
                
                try:
                    # Check if already published
                    result = run_command(
                        ["npm", "view", plugin_name, "version"],
                        check=False
                    )
                    
                    if result.returncode == 0:
                        published_version = result.stdout.strip()
                        if published_version == plugin_version:
                            log_warning(f"{plugin_name} v{plugin_version} already published, skipping")
                            published_plugins.append(plugin_name)
                            continue
                    
                    # Publish the plugin
                    run_command(["npm", "publish"], cwd=plugin_dir)
                    log_success(f"Published {plugin_name} v{plugin_version}")
                    published_plugins.append(plugin_name)
                    
                    # Wait a bit between publishes to avoid rate limiting
                    time.sleep(2)
                    
                except Exception as e:
                    log_error(f"Failed to publish {plugin_name}: {e}")
                    failed_plugins.append(plugin_name)
    
    if failed_plugins:
        log_error(f"Failed to publish {len(failed_plugins)} plugins:")
        for plugin in failed_plugins:
            log_error(f"  - {plugin}")
    
    return published_plugins

def publish_umbrella_package(version: str):
    """Publish the umbrella package"""
    log_info("Publishing umbrella package...")
    
    try:
        run_command(["npm", "publish"], cwd=PLUGINS_DIR)
        log_success(f"Published umbrella package @droply/plugins v{version}")
    except Exception as e:
        log_error(f"Failed to publish umbrella package: {e}")
        raise

def get_next_version() -> str:
    """Get the next version to publish by checking existing versions"""
    try:
        # Get current published versions
        result = run_command(["npm", "view", "@droply/plugins", "versions", "--json"], check=False)
        if result.returncode == 0:
            published_versions = json.loads(result.stdout)
            if published_versions:
                # Find the highest version
                highest_version = max(published_versions, key=lambda v: [int(x) for x in v.split('.')])
                log_info(f"Highest published version: {highest_version}")
                
                # Increment patch version
                parts = highest_version.split('.')
                if len(parts) >= 3:
                    major, minor, patch = parts[0], parts[1], parts[2]
                    new_patch = str(int(patch) + 1)
                    next_version = f"{major}.{minor}.{new_patch}"
                else:
                    # Fallback: just increment the last number
                    next_version = f"{highest_version}.1"
                
                log_info(f"Next version to publish: {next_version}")
                return next_version
    except Exception as e:
        log_warning(f"Could not determine next version automatically: {e}")
    
    # Fallback: ask user
    try:
        version = input("Enter version to publish (e.g., 2.0.1): ").strip()
        if not version:
            log_error("Version is required")
            sys.exit(1)
        return version
    except KeyboardInterrupt:
        log_info("\nPublishing cancelled")
        sys.exit(0)

def main():
    """Main publishing function"""
    log(f"{Colors.BOLD}🚀 Droply Plugins Publishing Script{Colors.END}")
    log("=" * 50)
    
    # Check prerequisites
    if not check_npm_auth():
        sys.exit(1)
    
    if not DIST_DIR.exists():
        log_error(f"Dist directory not found: {DIST_DIR}")
        log_info("Run ./build.sh first to build the plugins")
        sys.exit(1)
    
    # Get version to publish
    version = get_next_version()
    log_info(f"Starting publish process for version {version}")
    
    try:
        # Step 1: Update versions
        update_plugin_versions(version)
        update_umbrella_version(version)
        
        # Step 2: Publish individual plugins
        published_plugins = publish_individual_plugins(version)
        
        if not published_plugins:
            log_error("No plugins were published successfully")
            sys.exit(1)
        
        log_success(f"Successfully published {len(published_plugins)} individual plugins")
        
        # Step 3: Publish umbrella package
        publish_umbrella_package(version)
        
        # Final summary
        log(f"\n{Colors.BOLD}🎉 Publishing Complete!{Colors.END}")
        log(f"Version: {version}")
        log(f"Individual plugins published: {len(published_plugins)}")
        log(f"Umbrella package published: @droply/plugins@{version}")
        
        log(f"\n{Colors.BOLD}📦 Users can now install:{Colors.END}")
        log("  • Umbrella: npm install @droply/plugins")
        log("  • Individual: npm install @droply/plugins-nodejs-compression-gzip")
        
    except Exception as e:
        log_error(f"Publishing failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
