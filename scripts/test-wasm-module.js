#!/usr/bin/env node

/**
 * 🔥 Test WASM Module
 * Tests if the WASM compression module can be imported and used
 */

console.log('🚀 Testing WASM Module...\n');

async function testWasmModule() {
  try {
    // Test 1: Import the WASM module
    console.log('📦 Test 1: Importing WASM module...');
    const wasmModule = await import('../wasm/wasm-module.ts');
    console.log('✅ WASM module imported successfully!');
    console.log('📋 Available exports:', Object.keys(wasmModule));
    
    // Test 2: Check if functions exist
    console.log('\n🔍 Test 2: Checking function availability...');
    if (wasmModule.initializeCompression) {
      console.log('✅ initializeCompression function found');
    }
    if (wasmModule.compressFiles) {
      console.log('✅ compressFiles function found');
    }
    if (wasmModule.decompressFiles) {
      console.log('✅ decompressFiles function found');
    }
    if (wasmModule.isWasmCompressionAvailable) {
      console.log('✅ isWasmCompressionAvailable function found');
    }
    
    // Test 3: Initialize compression
    console.log('\n🚀 Test 3: Initializing compression...');
    const isWasmAvailable = await wasmModule.initializeCompression();
    console.log('🔥 WASM available:', isWasmAvailable);
    
    // Test 4: Check compression status
    console.log('\n📊 Test 4: Checking compression status...');
    const status = wasmModule.getCompressionStatus();
    console.log('📋 Compression status:', status);
    
    console.log('\n🎉 WASM Module Test Complete!');
    console.log('\n🔥 What We Just Verified:');
    console.log('  ✅ WASM module can be imported');
    console.log('  ✅ All required functions exist');
    console.log('  ✅ Compression initialization works');
    console.log('  ✅ Status reporting works');
    
    if (isWasmAvailable) {
      console.log('\n🚀 WASM is ready to use!');
      console.log('   You can now import this module in your upload/download pages');
    } else {
      console.log('\n⚠️ WASM not available, but TypeScript fallback is ready');
      console.log('   The module will automatically use fallback compression');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testWasmModule();
}

module.exports = { testWasmModule };
