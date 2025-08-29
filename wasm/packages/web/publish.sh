#!/bin/bash

# 🚀 Publishing script for @droply/web package
# This script builds and publishes the package to npm

set -e

echo "🌐 Publishing @droply/web package..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the @droply/web package directory."
    exit 1
fi

# Check if package.json has the right name
PACKAGE_NAME=$(node -p "require('./package.json').name")
if [ "$PACKAGE_NAME" != "@droply/web" ]; then
    print_error "This script is for @droply/web package, but found $PACKAGE_NAME"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Consider committing them before publishing."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Publishing cancelled."
        exit 0
    fi
fi

# Check if we're on the right branch (optional)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    print_warning "You're not on main/master branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Publishing cancelled."
        exit 0
    fi
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist node_modules/.cache

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the package
print_status "Building package..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

# Check build output
print_status "Build output:"
ls -la dist/

# Run tests if available
if npm run test 2>/dev/null; then
    print_success "Tests passed"
else
    print_warning "No tests found or tests failed"
fi

# Check package size
PACKAGE_SIZE=$(du -sh dist/ | cut -f1)
print_status "Package size: $PACKAGE_SIZE"

# Validate package
print_status "Validating package..."
npm pack --dry-run

# Ask for confirmation before publishing
echo
print_status "Ready to publish @droply/web@$CURRENT_VERSION"
echo "Package size: $PACKAGE_SIZE"
echo "Build output: dist/"
echo

read -p "Publish to npm? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if user is logged in to npm
    if ! npm whoami 2>/dev/null; then
        print_error "Not logged in to npm. Please run 'npm login' first."
        exit 1
    fi
    
    # Publish the package
    print_status "Publishing to npm..."
    npm publish --access public
    
    if [ $? -eq 0 ]; then
        print_success "Successfully published @droply/web@$CURRENT_VERSION to npm!"
        
        # Create git tag
        print_status "Creating git tag..."
        git tag "v$CURRENT_VERSION"
        git push origin "v$CURRENT_VERSION"
        
        print_success "Git tag v$CURRENT_VERSION created and pushed"
        
        # Show package info
        echo
        print_status "Package published successfully!"
        echo "Name: @droply/web"
        echo "Version: $CURRENT_VERSION"
        echo "Size: $PACKAGE_SIZE"
        echo "NPM: https://www.npmjs.com/package/@droply/web"
        
    else
        print_error "Failed to publish package"
        exit 1
    fi
else
    print_status "Publishing cancelled."
fi

print_success "Done! 🎉"
