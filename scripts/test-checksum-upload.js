// Test script for checksum functionality and duplicate detection
console.log('🧪 Testing checksum functionality and duplicate detection...');

// Test data - create files with same content to test duplicate detection
const testContent = 'This is test content for duplicate detection';
const testFiles = [
  new File([testContent], 'file1.txt', { type: 'text/plain' }),
  new File([testContent], 'file2.txt', { type: 'text/plain' }), // Same content, different name
  new File(['Different content'], 'file3.txt', { type: 'text/plain' }),
  new File([testContent], 'file4.txt', { type: 'text/plain' }) // Same content, different name
];

// Helper function to calculate SHA-256 checksum
async function calculateChecksum(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Test 1: Calculate checksums for all files
async function testChecksumCalculation() {
  console.log('📊 Testing checksum calculation...');
  
  const checksums = await Promise.all(
    testFiles.map(async (file) => {
      const checksum = await calculateChecksum(file);
      return { file, checksum };
    })
  );
  
  console.log('✅ Checksums calculated:');
  checksums.forEach(({ file, checksum }) => {
    console.log(`   ${file.name}: ${checksum.substring(0, 16)}...`);
  });
  
  return checksums;
}

// Test 2: Detect duplicates
async function testDuplicateDetection(checksums) {
  console.log('\n🔍 Testing duplicate detection...');
  
  const checksumMap = new Map();
  const duplicates = [];
  
  checksums.forEach(({ file, checksum }) => {
    if (checksumMap.has(checksum)) {
      duplicates.push({
        original: checksumMap.get(checksum),
        duplicate: { file, checksum }
      });
    } else {
      checksumMap.set(checksum, { file, checksum });
    }
  });
  
  if (duplicates.length > 0) {
    console.log('✅ Duplicates detected:');
    duplicates.forEach(({ original, duplicate }) => {
      console.log(`   ${original.file.name} ↔ ${duplicate.file.name} (same checksum)`);
    });
  } else {
    console.log('✅ No duplicates found');
  }
  
  return duplicates;
}

// Test 3: Test file size calculation
function testFileSizeCalculation(checksums) {
  console.log('\n📏 Testing file size calculation...');
  
  const totalSize = checksums.reduce((total, { file }) => total + file.size, 0);
  const totalSizeMB = totalSize / 1024 / 1024;
  
  console.log(`✅ Total size: ${totalSize} bytes (${totalSizeMB.toFixed(2)} MB)`);
  console.log(`✅ Files under 100MB: ${totalSizeMB < 100 ? 'Yes' : 'No'}`);
  
  return { totalSize, totalSizeMB };
}

// Test 4: Simulate upload form data
async function testUploadFormData(checksums) {
  console.log('\n📤 Testing upload form data preparation...');
  
  const formData = new FormData();
  
  // Add files
  checksums.forEach(({ file, checksum }) => {
    formData.append('files', file);
    formData.append('checksums', checksum);
  });
  
  // Add metadata
  const metadata = checksums.map(({ file, checksum }) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    checksum
  }));
  
  formData.append('meta', JSON.stringify(metadata));
  formData.append('isSingleFile', 'false');
  formData.append('password', 'test123');
  
  console.log('✅ Form data prepared:');
  console.log(`   Files: ${checksums.length}`);
  console.log(`   Metadata: ${JSON.stringify(metadata, null, 2)}`);
  console.log(`   Password: ${formData.get('password')}`);
  console.log(`   Is single file: ${formData.get('isSingleFile')}`);
  
  return formData;
}

// Test 5: Validate checksum integrity
async function testChecksumIntegrity(checksums) {
  console.log('\n🔒 Testing checksum integrity...');
  
  const integrityChecks = await Promise.all(
    checksums.map(async ({ file, checksum }) => {
      const recalculatedChecksum = await calculateChecksum(file);
      const isValid = checksum === recalculatedChecksum;
      
      return {
        file: file.name,
        originalChecksum: checksum.substring(0, 16) + '...',
        recalculatedChecksum: recalculatedChecksum.substring(0, 16) + '...',
        isValid
      };
    })
  );
  
  console.log('✅ Checksum integrity validation:');
  integrityChecks.forEach(check => {
    const status = check.isValid ? '✅' : '❌';
    console.log(`   ${status} ${check.file}: ${check.originalChecksum} = ${check.recalculatedChecksum}`);
  });
  
  const allValid = integrityChecks.every(check => check.isValid);
  console.log(`\n🎯 Overall integrity: ${allValid ? '✅ All checksums valid' : '❌ Some checksums invalid'}`);
  
  return integrityChecks;
}

// Run all tests
async function runTests() {
  console.log('🎯 Starting checksum functionality tests...\n');
  
  try {
    // Test 1: Calculate checksums
    const checksums = await testChecksumCalculation();
    
    // Test 2: Detect duplicates
    const duplicates = await testDuplicateDetection(checksums);
    
    // Test 3: Calculate file sizes
    const sizeInfo = testFileSizeCalculation(checksums);
    
    // Test 4: Prepare upload data
    const formData = await testUploadFormData(checksums);
    
    // Test 5: Validate integrity
    const integrityChecks = await testChecksumIntegrity(checksums);
    
    // Final results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CHECKSUM FUNCTIONALITY TEST RESULTS 🎉');
    console.log('='.repeat(60));
    console.log(`✅ Files processed: ${checksums.length}`);
    console.log(`✅ Duplicates found: ${duplicates.length}`);
    console.log(`✅ Total size: ${sizeInfo.totalSizeMB.toFixed(2)} MB`);
    console.log(`✅ Checksums valid: ${integrityChecks.filter(c => c.isValid).length}/${integrityChecks.length}`);
    console.log(`✅ Form data ready: ${formData ? 'Yes' : 'No'}`);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Duplicate files detected - these would be filtered out in the real upload');
    }
    
    console.log('\n🚀 All checksum tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Start tests when script loads
console.log('📋 Checksum test script loaded. Run runTests() to start testing.');

// Auto-run tests after a short delay
setTimeout(() => {
  console.log('\n🔄 Auto-running checksum tests in 3 seconds...');
  setTimeout(runTests, 3000);
}, 1000);
