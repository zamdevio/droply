#!/usr/bin/env node

// Test script for Droply SDK Registry
import { Registry } from './dist/index.js';

console.log('🧪 Testing Droply SDK Registry...\n');

// Debug: Show current working directory
console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 Script location:', import.meta.url);
console.log('');

async function testRegistry() {
  try {
    const registry = new Registry();
    
    // Test 1: Get registry info
    console.log('📋 Test 1: Registry Info');
    const registryVersion = await registry.getRegistryVersion();
    const metadata = await registry.getRegistryMetadata();
    console.log(`  ✅ Registry version: ${registryVersion}`);
    console.log(`  ✅ Total plugins: ${metadata.total_plugins}`);
    console.log(`  ✅ Generated at: ${metadata.generated_at}\n`);
    
    // Test 2: Platform detection
    console.log('🖥️  Test 2: Platform Detection');
    const currentPlatform = await registry.getCurrentPlatform();
    const supportedPlatforms = await registry.getSupportedPlatforms();
    console.log(`  ✅ Current platform: ${currentPlatform}`);
    console.log(`  ✅ Supported platforms: ${supportedPlatforms.join(', ')}\n`);
    
    // Test 3: Compression algorithms
    console.log('🗜️  Test 3: Compression Algorithms');
    const compressionAlgos = await registry.getSupportedCompressionAlgorithms();
    console.log(`  ✅ Supported compression: ${compressionAlgos.join(', ')}`);
    
    // Test specific platform
    const nodejsCompression = await registry.getSupportedCompressionAlgorithms('nodejs');
    console.log(`  ✅ Node.js compression: ${nodejsCompression.join(', ')}`);
    
    const webCompression = await registry.getSupportedCompressionAlgorithms('web');
    console.log(`  ✅ Web compression: ${webCompression.join(', ')}\n`);
    
    // Test 4: Archive formats
    console.log('📦 Test 4: Archive Formats');
    const archiveFormats = await registry.getSupportedArchiveFormats();
    console.log(`  ✅ Supported archives: ${archiveFormats.join(', ')}`);
    
    const bundlerArchives = await registry.getSupportedArchiveFormats('bundler');
    console.log(`  ✅ Bundler archives: ${bundlerArchives.join(', ')}\n`);
    
    // Test 5: Algorithm validation
    console.log('✅ Test 5: Algorithm Validation');
    const isGzipSupported = await registry.isCompressionAlgorithmSupported('gzip');
    const isBrotliSupported = await registry.isCompressionAlgorithmSupported('brotli');
    const isZipSupported = await registry.isArchiveFormatSupported('zip');
    const isTarSupported = await registry.isArchiveFormatSupported('tar');
    
    console.log(`  ✅ Gzip supported: ${isGzipSupported}`);
    console.log(`  ✅ Brotli supported: ${isBrotliSupported}`);
    console.log(`  ✅ ZIP supported: ${isZipSupported}`);
    console.log(`  ✅ TAR supported: ${isTarSupported}\n`);
    
    // Test 6: Extension mapping
    console.log('🔗 Test 6: Extension Mapping');
    const gzipAlgo = await registry.getCompressionAlgorithmForExtension('gz');
    const zipFormat = await registry.getArchiveFormatForExtension('zip');
    
    console.log(`  ✅ .gz → ${gzipAlgo}`);
    console.log(`  ✅ .zip → ${zipFormat}\n`);
    
    // Test 7: Plugin details
    console.log('🔍 Test 7: Plugin Details');
    const gzipPlugin = await registry.getCompressionPlugin('gzip', 'nodejs');
    if (gzipPlugin) {
      console.log(`  ✅ Gzip plugin: ${gzipPlugin.name} v${gzipPlugin.version}`);
      console.log(`  ✅ Description: ${gzipPlugin.description}`);
      console.log(`  ✅ Extensions: ${gzipPlugin.extensions.join(', ')}`);
      console.log(`  ✅ Compression levels: ${gzipPlugin.compression_levels.min}-${gzipPlugin.compression_levels.max} (default: ${gzipPlugin.compression_levels.default})`);
      console.log(`  ✅ Module path: ${gzipPlugin.paths.module}`);
      console.log(`  ✅ WASM path: ${gzipPlugin.paths.wasm}`);
    }
    
    console.log('\n🎉 All registry tests passed!');
    
  } catch (error) {
    console.error('❌ Registry test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRegistry();
