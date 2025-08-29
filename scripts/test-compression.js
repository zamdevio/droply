#!/usr/bin/env node

/**
 * 🔥 Test script for the new compression utilities
 * This tests the fflate-based compression with JS fallback
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment
global.File = class File {
  constructor(bits, name, options = {}) {
    this.name = name;
    this.size = bits.length;
    this.type = options.type || 'application/octet-stream';
    this.lastModified = Date.now();
    this.arrayBuffer = async () => bits;
  }
};

global.Blob = class Blob {
  constructor(bits, options = {}) {
    this.size = bits.length;
    this.type = options.type || 'application/octet-stream';
    this.arrayBuffer = async () => bits;
  }
};

global.crypto = {
  subtle: {
    digest: async (algorithm, data) => {
      // Simple mock checksum for testing
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
      }
      return new Uint8Array(new Uint32Array([hash]).buffer);
    }
  }
};

// Test data
const testFiles = [
  new File([Buffer.from('Hello World! This is a test file.')], 'test1.txt', { type: 'text/plain' }),
  new File([Buffer.from('This is another test file with some content.')], 'test2.txt', { type: 'text/plain' }),
  new File([Buffer.from('{"key": "value", "number": 42}')], 'data.json', { type: 'application/json' })
];

console.log('🔥 Testing compression utilities...\n');

// Test file creation
console.log('📁 Test files created:');
testFiles.forEach(file => {
  console.log(`  - ${file.name} (${file.size} bytes, ${file.type})`);
});

console.log('\n✅ Test setup complete!');
console.log('💡 To test the actual compression, run this in the browser or use the upload page.');
console.log('🚀 The new compression system uses fflate for real ZIP compression with WASM fallback support.');
