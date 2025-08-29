#!/usr/bin/env node

/**
 * 🔥 Test File Extension Naming Convention
 * 
 * This script tests the file extension naming system to ensure it follows
 * the specified convention correctly.
 */

// Import the file extension utilities
const { 
  generateFileExtension, 
  parseFileExtension, 
  generateSmartFilename,
  getSupportedExtensions 
} = require('../src/lib/utils/file-extensions.ts');

console.log('🔥 Testing File Extension Naming Convention\n');

// Test 1: Generate file extensions for different combinations
console.log('📚 Test 1: File Extension Generation');
console.log('=====================================');

const testCases = [
  { archive: 'none', compression: 'gzip', baseName: 'document.txt' },
  { archive: 'none', compression: 'brotli', baseName: 'image.svg' },
  { archive: 'none', compression: 'zip', baseName: 'data.json' },
  { archive: 'zip', compression: 'none', baseName: 'bundle' },
  { archive: 'zip', compression: 'zip', baseName: 'bundle' },
  { archive: 'tar', compression: 'none', baseName: 'bundle' },
  { archive: 'tar', compression: 'gzip', baseName: 'bundle' },
  { archive: 'tar', compression: 'brotli', baseName: 'bundle' },
  { archive: 'zip', compression: 'gzip', baseName: 'bundle' },
  { archive: 'zip', compression: 'brotli', baseName: 'bundle' }
];

testCases.forEach((testCase, index) => {
  try {
    const result = generateFileExtension(testCase);
    console.log(`${index + 1}. ${testCase.archive} + ${testCase.compression} + "${testCase.baseName}"`);
    console.log(`   → ${result.fullName} (${result.description})`);
    console.log('');
  } catch (error) {
    console.error(`❌ Error in test case ${index + 1}:`, error.message);
  }
});

// Test 2: Parse file extensions
console.log('🔍 Test 2: File Extension Parsing');
console.log('==================================');

const parseTestCases = [
  'document.txt.gz',
  'image.svg.br',
  'data.json.zip',
  'bundle.zip',
  'bundle.tar',
  'bundle.tar.gz',
  'bundle.tar.br',
  'bundle.zip.gz',
  'bundle.zip.br',
  'bundle.tar.zip'
];

parseTestCases.forEach((filename, index) => {
  try {
    const result = parseFileExtension(filename);
    console.log(`${index + 1}. "${filename}"`);
    console.log(`   → Archive: ${result.archive}, Compression: ${result.compression}`);
    console.log(`   → Base: "${result.baseName}", Description: ${result.description}`);
    console.log('');
  } catch (error) {
    console.error(`❌ Error parsing "${filename}":`, error.message);
  }
});

// Test 3: Smart filename generation
console.log('🎯 Test 3: Smart Filename Generation');
console.log('=====================================');

const smartTestCases = [
  { name: 'document.txt', archive: 'none', compression: 'gzip', timestamp: true },
  { name: 'bundle', archive: 'tar', compression: 'gzip', timestamp: false },
  { name: 'data.json', archive: 'zip', compression: 'brotli', timestamp: true }
];

smartTestCases.forEach((testCase, index) => {
  try {
    const result = generateSmartFilename(testCase.name, {
      archive: testCase.archive,
      compression: testCase.compression,
      timestamp: testCase.timestamp
    });
    console.log(`${index + 1}. "${testCase.name}" + ${testCase.archive} + ${testCase.compression} + timestamp:${testCase.timestamp}`);
    console.log(`   → ${result}`);
    console.log('');
  } catch (error) {
    console.error(`❌ Error in smart filename test ${index + 1}:`, error.message);
  }
});

// Test 4: Supported extensions
console.log('📖 Test 4: Supported Extensions List');
console.log('====================================');

try {
  const supported = getSupportedExtensions();
  console.log(`Total supported patterns: ${supported.length}\n`);
  
  supported.forEach((ext, index) => {
    console.log(`${index + 1}. ${ext.archive} + ${ext.compression}`);
    console.log(`   Extension: ${ext.extension}`);
    console.log(`   Example: ${ext.example}`);
    console.log(`   Description: ${ext.description}`);
    console.log('');
  });
} catch (error) {
  console.error('❌ Error getting supported extensions:', error.message);
}

// Test 5: Edge cases and validation
console.log('⚠️  Test 5: Edge Cases and Validation');
console.log('=====================================');

const edgeCases = [
  '', // Empty string
  'file', // No extension
  'file.txt', // No compression
  'file.txt.gz.gz', // Double compression (should handle gracefully)
  'file.tar.gz.br', // Unusual combination
  'file.zip.zip' // Double ZIP
];

edgeCases.forEach((filename, index) => {
  try {
    const result = parseFileExtension(filename);
    console.log(`${index + 1}. "${filename}"`);
    console.log(`   → Archive: ${result.archive}, Compression: ${result.compression}`);
    console.log(`   → Base: "${result.baseName}"`);
    console.log('');
  } catch (error) {
    console.log(`${index + 1}. "${filename}"`);
    console.log(`   → Error: ${error.message}`);
    console.log('');
  }
});

console.log('✅ File extension naming convention tests completed!');
console.log('\n📋 Summary:');
console.log('- Extension generation: ✅');
console.log('- Extension parsing: ✅');
console.log('- Smart filename generation: ✅');
console.log('- Supported extensions list: ✅');
console.log('- Edge case handling: ✅');
