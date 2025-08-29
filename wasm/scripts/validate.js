#!/usr/bin/env node

/**
 * Simple validation script for @droply packages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

function validatePackage(packageName) {
  const packageDir = path.join(ROOT_DIR, 'packages', packageName);
  const packageJsonPath = path.join(packageDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Package ${packageName} not found`);
  }
  
  console.log(`\n🔍 Validating @droply/${packageName}...`);
  
  // Check if required files exist
  const requiredFiles = ['README.md', 'LICENSE', 'package.json'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(packageDir, file))) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
  
  // Check if dist/build directories exist
  if (packageName === 'sdk' || packageName === 'cli') {
    if (!fs.existsSync(path.join(packageDir, 'dist'))) {
      throw new Error('Missing dist directory');
    }
  } else if (packageName === 'plugins') {
    if (!fs.existsSync(path.join(packageDir, 'build'))) {
      throw new Error('Missing build directory');
    }
    if (!fs.existsSync(path.join(packageDir, 'build-node'))) {
      throw new Error('Missing build-node directory');
    }
  }
  
  console.log(`✅ @droply/${packageName} validation passed`);
}

function main() {
  try {
    console.log('🚀 Package validation starting...\n');
    
    // Validate all packages
    validatePackage('plugins');
    validatePackage('sdk');
    validatePackage('cli');
    
    console.log('\n🎉 All packages validated successfully!');
    console.log('✅ Ready for use');
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
