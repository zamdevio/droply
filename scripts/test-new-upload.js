// Test script for the new multi-file upload flow with compression and metadata
// This script tests the end-to-end flow: multiple files → compression → upload → metadata storage

console.log('🧪 Testing new multi-file upload flow with compression and metadata...');

// Test data
const testFiles = [
  {
    name: 'test-image.png',
    size: 1024 * 1024, // 1MB
    type: 'image/png',
    content: 'fake-image-data'
  },
  {
    name: 'test-document.pdf',
    size: 512 * 1024, // 512KB
    type: 'application/pdf',
    content: 'fake-pdf-data'
  },
  {
    name: 'test-video.mp4',
    size: 5 * 1024 * 1024, // 5MB
    type: 'video/mp4',
    content: 'fake-video-data'
  }
];

// Simulate file objects
function createFileObjects() {
  return testFiles.map(file => {
    const blob = new Blob([file.content], { type: file.type });
    return new File([blob], file.name, { type: file.type });
  });
}

// Test the compressor utility
async function testCompressor() {
  console.log('📦 Testing compressor utility...');
  
  try {
    // Import the compressor (this will be available in the browser)
    const { compressFiles, validateMetadata } = await import('../src/utils/compressor.ts');
    
    const files = createFileObjects();
    console.log(`✅ Created ${files.length} test files`);
    
    // Test compression
    const { zipBlob, meta } = await compressFiles(files);
    console.log('✅ Compression successful');
    console.log('📊 Generated metadata:', meta);
    console.log('🗜️ ZIP size:', (zipBlob.size / 1024 / 1024).toFixed(2), 'MB');
    
    // Test metadata validation
    const isValid = await validateMetadata(zipBlob, meta);
    console.log('✅ Metadata validation:', isValid ? 'PASSED' : 'FAILED');
    
    return { zipBlob, meta };
    
  } catch (error) {
    console.error('❌ Compressor test failed:', error);
    return null;
  }
}

// Test single file upload
async function testSingleFileUpload() {
  console.log('📁 Testing single file upload...');
  
  try {
    const testFile = new File(['single-file-content'], 'test.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('isSingleFile', 'true');
    formData.append('expiresIn', '7d');
    formData.append('maxDownloads', '10');
    
    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Single file upload test successful');
      console.log('📄 Response:', result.data);
      return result.data;
    } else {
      console.error('❌ Single file upload test failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Single file upload test failed:', error);
    return null;
  }
}

// Test multi-file upload (ZIP compression)
async function testMultiFileUpload(zipBlob, meta) {
  console.log('🗜️ Testing multi-file upload (ZIP compression)...');
  
  try {
    const formData = new FormData();
    formData.append('file', zipBlob);
    formData.append('isSingleFile', 'false');
    formData.append('expiresIn', '7d');
    formData.append('maxDownloads', '10');
    formData.append('meta', JSON.stringify(meta));
    
    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Multi-file upload test successful');
      console.log('📄 Response:', result.data);
      return result.data;
    } else {
      console.error('❌ Multi-file upload test failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Multi-file upload test failed:', error);
    return null;
  }
}

// Test file size validation
async function testFileSizeValidation() {
  console.log('📏 Testing file size validation (100MB limit)...');
  
  try {
    // Create a fake file larger than 100MB
    const largeContent = 'x'.repeat(101 * 1024 * 1024); // 101MB
    const largeFile = new File([largeContent], 'large-file.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', largeFile);
    formData.append('isSingleFile', 'true');
    formData.append('expiresIn', '7d');
    
    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!result.success && result.error === 'File too large') {
      console.log('✅ File size validation working correctly');
      return true;
    } else {
      console.error('❌ File size validation failed - large file was accepted');
      return false;
    }
    
  } catch (error) {
    console.error('❌ File size validation test failed:', error);
    return false;
  }
}

// Test metadata corruption detection
async function testMetadataCorruption() {
  console.log('🚨 Testing metadata corruption detection...');
  
  try {
    const { zipBlob } = await testCompressor();
    
    // Create corrupted metadata
    const corruptedMeta = [
      { name: 'fake-file.txt', size: 999999, type: 'text/plain' }
    ];
    
    const formData = new FormData();
    formData.append('file', zipBlob);
    formData.append('isSingleFile', 'false');
    formData.append('expiresIn', '7d');
    formData.append('meta', JSON.stringify(corruptedMeta));
    
    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!result.success && result.error === 'Metadata corrupted') {
      console.log('✅ Metadata corruption detection working correctly');
      return true;
    } else {
      console.error('❌ Metadata corruption detection failed - corrupted metadata was accepted');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Metadata corruption test failed:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🎯 Starting comprehensive multi-file upload flow tests...\n');
  
  // Test 1: Compressor
  const compressionResult = await testCompressor();
  if (!compressionResult) {
    console.log('❌ Compression test failed, stopping tests');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Single File Upload
  const singleFileResult = await testSingleFileUpload();
  if (!singleFileResult) {
    console.log('❌ Single file upload test failed, stopping tests');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Multi-File Upload (ZIP)
  const multiFileResult = await testMultiFileUpload(compressionResult.zipBlob, compressionResult.meta);
  if (!multiFileResult) {
    console.log('❌ Multi-file upload test failed, stopping tests');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: File Size Validation
  const sizeValidationResult = await testFileSizeValidation();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: Metadata Corruption Detection
  const corruptionResult = await testMetadataCorruption();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Final results
  if (sizeValidationResult && corruptionResult) {
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('✅ Compression: Working');
    console.log('✅ Single File Upload: Working');
    console.log('✅ Multi-File Upload: Working');
    console.log('✅ File Size Validation: Working');
    console.log('✅ Metadata Corruption Detection: Working');
    console.log('\n🚀 New multi-file upload flow is fully functional!');
  } else {
    console.log('❌ Some tests failed. Check the logs above.');
  }
}

// Start tests when script loads
console.log('📋 Test script loaded. Run runTests() to start testing.');
console.log('💡 You can also test individual functions:');
console.log('   - testCompressor()');
console.log('   - testSingleFileUpload()');
console.log('   - testMultiFileUpload()');
console.log('   - testFileSizeValidation()');
console.log('   - testMetadataCorruption()');

// Auto-run tests after a short delay
setTimeout(() => {
  console.log('\n🔄 Auto-running tests in 3 seconds...');
  setTimeout(runTests, 3000);
}, 1000);
