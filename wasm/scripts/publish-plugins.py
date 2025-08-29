#!/usr/bin/env python3
"""
Advanced Droply Plugins Publishing Script
Supports selective publishing, bulk operations, and advanced filtering.
"""

import json
import os
import sys
import subprocess
import time
import argparse
from pathlib import Path
from typing import List, Dict, Any, Set
from dataclasses import dataclass

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

@dataclass
class PublishTarget:
    """Represents a publishing target with filters"""
    platforms: Set[str] = None
    kinds: Set[str] = None
    algos: Set[str] = None
    specific_plugins: Set[str] = None
    
    def __post_init__(self):
        if self.platforms is None:
            self.platforms = {'nodejs', 'bundler', 'web'}
        if self.kinds is None:
            self.kinds = {'compression', 'archive'}
        if self.algos is None:
            self.algos = set()
        if self.specific_plugins is None:
            self.specific_plugins = set()

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

def log_header(message: str):
    """Print header message"""
    log(f"\n{Colors.BOLD}{message}{Colors.END}")
    log("=" * len(message))

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

def get_available_plugins() -> List[Dict[str, Any]]:
    """Get list of all available plugins from registry"""
    registry = load_registry()
    return registry.get('plugins', [])

def filter_plugins_by_target(plugins: List[Dict[str, Any]], target: PublishTarget) -> List[Dict[str, Any]]:
    """Filter plugins based on target criteria"""
    filtered = []
    
    for plugin in plugins:
        # Check platform filter
        if target.platforms and plugin.get('platform') not in target.platforms:
            continue
            
        # Check kind filter
        if target.kinds and plugin.get('kind') not in target.kinds:
            continue
            
        # Check algo filter
        if target.algos and plugin.get('algo') not in target.algos:
            continue
            
        # Check specific plugin filter
        if target.specific_plugins:
            plugin_name = f"@droply/plugins-{plugin['platform']}-{plugin['kind']}-{plugin['algo']}"
            if plugin_name not in target.specific_plugins:
                continue
        
        filtered.append(plugin)
    
    return filtered

def get_plugin_directory(plugin: Dict[str, Any]) -> Path:
    """Get the directory path for a plugin"""
    platform = plugin['platform']
    kind = plugin['kind']
    algo = plugin['algo']
    return DIST_DIR / platform / kind / algo

def update_plugin_version(plugin_dir: Path, version: str) -> str:
    """Update version in a plugin's package.json"""
    pkg_json = plugin_dir / "package.json"
    if not pkg_json.exists():
        return "unknown"
    
    with open(pkg_json, 'r') as f:
        pkg_data = json.load(f)
    
    old_version = pkg_data.get('version', 'unknown')
    pkg_data['version'] = version
    
    with open(pkg_json, 'w') as f:
        json.dump(pkg_data, f, indent=2)
    
    return old_version

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

def get_next_version() -> str:
    """Get the next version to publish by checking existing versions"""
    try:
        result = run_command(["npm", "view", "@droply/plugins", "versions", "--json"], check=False)
        if result.returncode == 0:
            published_versions = json.loads(result.stdout)
            if published_versions:
                highest_version = max(published_versions, key=lambda v: [int(x) for x in v.split('.')])
                log_info(f"Highest published version: {highest_version}")
                
                parts = highest_version.split('.')
                if len(parts) >= 3:
                    major, minor, patch = parts[0], parts[1], parts[2]
                    new_patch = str(int(patch) + 1)
                    next_version = f"{major}.{minor}.{new_patch}"
                else:
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

def publish_plugin(plugin: Dict[str, Any], version: str, dry_run: bool = False) -> bool:
    """Publish a single plugin"""
    plugin_name = f"@droply/plugins-{plugin['platform']}-{plugin['kind']}-{plugin['algo']}"
    plugin_dir = get_plugin_directory(plugin)
    
    if not plugin_dir.exists():
        log_error(f"Plugin directory not found: {plugin_dir}")
        return False
    
    log_info(f"Publishing {plugin_name} v{version}...")
    
    if dry_run:
        log_warning(f"[DRY RUN] Would publish {plugin_name} v{version}")
        return True
    
    try:
        # Check if already published
        result = run_command(
            ["npm", "view", plugin_name, "version"],
            check=False
        )
        
        if result.returncode == 0:
            published_version = result.stdout.strip()
            if published_version == version:
                log_warning(f"{plugin_name} v{version} already published, skipping")
                return True
        
        # Publish the plugin
        run_command(["npm", "publish"], cwd=plugin_dir)
        log_success(f"Published {plugin_name} v{version}")
        return True
        
    except Exception as e:
        log_error(f"Failed to publish {plugin_name}: {e}")
        return False

def publish_plugins(plugins: List[Dict[str, Any]], version: str, dry_run: bool = False) -> Dict[str, Any]:
    """Publish multiple plugins"""
    log_header(f"Publishing {len(plugins)} plugins")
    
    published_plugins = []
    failed_plugins = []
    
    for i, plugin in enumerate(plugins, 1):
        log_info(f"Progress: {i}/{len(plugins)}")
        
        if publish_plugin(plugin, version, dry_run):
            published_plugins.append(plugin)
        else:
            failed_plugins.append(plugin)
        
        # Wait between publishes to avoid rate limiting (unless dry run)
        if not dry_run and i < len(plugins):
            time.sleep(2)
    
    return {
        'published': published_plugins,
        'failed': failed_plugins,
        'total': len(plugins)
    }

def publish_umbrella_package(version: str, dry_run: bool = False):
    """Publish the umbrella package"""
    log_header("Publishing umbrella package")
    
    if dry_run:
        log_warning(f"[DRY RUN] Would publish umbrella package @droply/plugins v{version}")
        return True
    
    try:
        run_command(["npm", "publish"], cwd=PLUGINS_DIR)
        log_success(f"Published umbrella package @droply/plugins v{version}")
        return True
    except Exception as e:
        log_error(f"Failed to publish umbrella package: {e}")
        return False

def show_help():
    """Show help information"""
    help_text = f"""
{Colors.BOLD}🚀 Droply Plugins Publishing Script - Advanced Mode{Colors.END}

{Colors.BOLD}Usage:{Colors.END}
  python3 scripts/publish-plugins.py [OPTIONS]

{Colors.BOLD}Options:{Colors.END}
  --all                    Publish all plugins (default behavior)
  --platform PLATFORM      Publish only specific platform(s)
                          (nodejs, bundler, web)
  --kind KIND             Publish only specific kind(s)
                          (compression, archive)
  --algo ALGO             Publish only specific algorithm(s)
                          (gzip, brotli, zip, tar)
  --plugin PLUGIN         Publish specific plugin(s) by full name
                          (e.g., @droply/plugins-nodejs-compression-gzip)
  --version VERSION       Specify version to publish
                          (auto-detected if not specified)
  --dry-run               Show what would be published without actually publishing
  --no-umbrella           Skip publishing umbrella package
  --help                  Show this help message

{Colors.BOLD}Examples:{Colors.END}
  # Publish all plugins (default)
  python3 scripts/publish-plugins.py

  # Publish only Node.js plugins
  python3 scripts/publish-plugins.py --platform nodejs

  # Publish only compression plugins for bundler
  python3 scripts/publish-plugins.py --platform bundler --kind compression

  # Publish only gzip compression plugins
  python3 scripts/publish-plugins.py --algo gzip

  # Publish specific plugin
  python3 scripts/publish-plugins.py --plugin @droply/plugins-nodejs-compression-gzip

  # Dry run to see what would be published
  python3 scripts/publish-plugins.py --platform web --dry-run

  # Publish with specific version
  python3 scripts/publish-plugins.py --version 2.1.0

{Colors.BOLD}Available Platforms:{Colors.END}
  • nodejs   - Server-side Node.js applications
  • bundler  - Next.js, Webpack, Rollup, etc.
  • web      - Direct browser usage, vanilla JS

{Colors.BOLD}Available Kinds:{Colors.END}
  • compression - Data compression algorithms
  • archive    - File archiving formats

{Colors.BOLD}Available Algorithms:{Colors.END}
  • gzip   - Gzip compression
  • brotli - Brotli compression
  • zip    - ZIP compression/archiving
  • tar    - TAR archiving
"""
    print(help_text)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Advanced Droply Plugins Publishing Script",
        add_help=False
    )
    
    parser.add_argument('--all', action='store_true', 
                       help='Publish all plugins (default)')
    parser.add_argument('--platform', action='append', 
                       choices=['nodejs', 'bundler', 'web'],
                       help='Publish only specific platform(s)')
    parser.add_argument('--kind', action='append',
                       choices=['compression', 'archive'],
                       help='Publish only specific kind(s)')
    parser.add_argument('--algo', action='append',
                       choices=['gzip', 'brotli', 'zip', 'tar'],
                       help='Publish only specific algorithm(s)')
    parser.add_argument('--plugin', action='append',
                       help='Publish specific plugin(s) by full name')
    parser.add_argument('--version', type=str,
                       help='Specify version to publish')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be published without actually publishing')
    parser.add_argument('--no-umbrella', action='store_true',
                       help='Skip publishing umbrella package')
    parser.add_argument('--help', action='store_true',
                       help='Show help message')
    
    return parser.parse_args()

def main():
    """Main publishing function"""
    args = parse_arguments()
    
    # Show help if requested
    if args.help:
        show_help()
        return
    
    log_header("🚀 Droply Plugins Publishing Script - Advanced Mode")
    
    # Check prerequisites
    if not check_npm_auth():
        sys.exit(1)
    
    if not DIST_DIR.exists():
        log_error(f"Dist directory not found: {DIST_DIR}")
        log_info("Run ./build.sh first to build the plugins")
        sys.exit(1)
    
    # Build publish target from arguments
    target = PublishTarget()
    
    if args.platform:
        target.platforms = set(args.platform)
    if args.kind:
        target.kinds = set(args.kind)
    if args.algo:
        target.algos = set(args.algo)
    if args.plugin:
        target.specific_plugins = set(args.plugin)
    
    # Get available plugins and filter them
    all_plugins = get_available_plugins()
    filtered_plugins = filter_plugins_by_target(all_plugins, target)
    
    if not filtered_plugins:
        log_error("No plugins match the specified criteria")
        log_info("Available plugins:")
        for plugin in all_plugins:
            plugin_name = f"@droply/plugins-{plugin['platform']}-{plugin['kind']}-{plugin['algo']}"
            log_info(f"  • {plugin_name}")
        sys.exit(1)
    
    # Show what will be published
    log_header(f"Publishing Summary")
    log_info(f"Total plugins to publish: {len(filtered_plugins)}")
    
    if target.platforms:
        log_info(f"Platforms: {', '.join(sorted(target.platforms))}")
    if target.kinds:
        log_info(f"Kinds: {', '.join(sorted(target.kinds))}")
    if target.algos:
        log_info(f"Algorithms: {', '.join(sorted(target.algos))}")
    if target.specific_plugins:
        log_info(f"Specific plugins: {', '.join(sorted(target.specific_plugins))}")
    
    log_info("Plugins to publish:")
    for plugin in filtered_plugins:
        plugin_name = f"@droply/plugins-{plugin['platform']}-{plugin['kind']}-{plugin['algo']}"
        log_info(f"  • {plugin_name}")
    
    # Get version
    version = args.version or get_next_version()
    log_info(f"Version: {version}")
    
    if args.dry_run:
        log_warning("DRY RUN MODE - No packages will actually be published")
    
    # Confirm before proceeding (unless dry run)
    if not args.dry_run:
        try:
            confirm = input(f"\nProceed with publishing {len(filtered_plugins)} plugins? (y/N): ").strip().lower()
            if confirm not in ['y', 'yes']:
                log_info("Publishing cancelled")
                return
        except KeyboardInterrupt:
            log_info("\nPublishing cancelled")
            return
    
    try:
        # Step 1: Update versions
        log_header("Updating Package Versions")
        for plugin in filtered_plugins:
            plugin_dir = get_plugin_directory(plugin)
            old_version = update_plugin_version(plugin_dir, version)
            plugin_name = f"@droply/plugins-{plugin['platform']}-{plugin['kind']}-{plugin['algo']}"
            log_success(f"Updated {plugin_name}: {old_version} → {version}")
        
        if not args.no_umbrella:
            update_umbrella_version(version)
        
        # Step 2: Publish individual plugins
        results = publish_plugins(filtered_plugins, version, args.dry_run)
        
        # Step 3: Publish umbrella package (unless skipped)
        umbrella_success = True
        if not args.no_umbrella and not args.dry_run:
            umbrella_success = publish_umbrella_package(version, args.dry_run)
        
        # Final summary
        log_header("🎉 Publishing Complete!")
        log(f"Version: {version}")
        log(f"Individual plugins published: {len(results['published'])}")
        log(f"Individual plugins failed: {len(results['failed'])}")
        
        if not args.no_umbrella:
            if umbrella_success:
                log_success("Umbrella package published: @droply/plugins")
            else:
                log_error("Umbrella package failed to publish")
        
        if results['failed']:
            log_error("Failed plugins:")
            for plugin in results['failed']:
                plugin_name = f"@droply/plugins-{plugin['platform']}-{plugin['kind']}-{plugin['algo']}"
                log_error(f"  - {plugin_name}")
        
        if not args.dry_run:
            log(f"\n{Colors.BOLD}📦 Users can now install:{Colors.END}")
            log("  • Umbrella: npm install @droply/plugins")
            log("  • Individual: npm install @droply/plugins-nodejs-compression-gzip")
        
    except Exception as e:
        log_error(f"Publishing failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
