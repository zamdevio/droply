// Test script for advanced APIs with password-based ownership and high-performance features
// This script tests: upload → info → edit → delete with password validation

console.log('🧪 Testing advanced APIs with password-based ownership...');

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
  }
];

// Simulate file objects
function createFileObjects() {
  return testFiles.map(file => {
    const blob = new Blob([file.content], { type: file.type });
    return new File([blob], file.name, { type: file.type });
  });
}

// Test 1: Upload with password protection
async function testUploadWithPassword() {
  console.log('📤 Testing upload with password protection...');
  
  try {
    const files = createFileObjects();
    const { compressFiles } = await import('../src/utils/compressor.ts');
    
    // Compress files
    const { zipBlob, meta } = await compressFiles(files);
    
    const formData = new FormData();
    formData.append('file', zipBlob);
    formData.append('isSingleFile', 'false');
    formData.append('password', 'test123');
    formData.append('expiresIn', '7d');
    formData.append('maxDownloads', '10');
    formData.append('meta', JSON.stringify(meta));
    
    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Upload with password successful');
      console.log('📄 Response:', result.data);
      return result.data;
    } else {
      console.error('❌ Upload with password failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Upload with password test failed:', error);
    return null;
  }
}

// Test 2: Upload without password (should fail for edit/delete)
async function testUploadWithoutPassword() {
  console.log('📤 Testing upload without password protection...');
  
  try {
    const testFile = new File(['single-file-content'], 'test.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('isSingleFile', 'true');
    formData.append('expiresIn', '7d');
    
    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Upload without password successful');
      console.log('📄 Response:', result.data);
      return result.data;
    } else {
      console.error('❌ Upload without password failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Upload without password test failed:', error);
    return null;
  }
}

// Test 3: Info API with password
async function testInfoWithPassword(fileId, password) {
  console.log('📋 Testing info API with password...');
  
  try {
    const response = await fetch(`/api/v1/info/${fileId}?password=${password}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Info with password successful');
      console.log('📄 Response:', result.data);
      return result.data;
    } else {
      console.error('❌ Info with password failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Info with password test failed:', error);
    return null;
  }
}

// Test 4: Info API without password (should fail for password-protected files)
async function testInfoWithoutPassword(fileId) {
  console.log('📋 Testing info API without password...');
  
  try {
    const response = await fetch(`/api/v1/info/${fileId}`);
    const result = await response.json();
    
    if (!result.success && result.error === 'Password required') {
      console.log('✅ Info without password correctly rejected');
      return true;
    } else {
      console.error('❌ Info without password should have been rejected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Info without password test failed:', error);
    return false;
  }
}

// Test 5: Edit API with correct password
async function testEditWithPassword(fileId, password) {
  console.log('✏️ Testing edit API with correct password...');
  
  try {
    const response = await fetch(`/api/v1/edit/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-file-password': password,
      },
      body: JSON.stringify({
        originalName: 'updated-file-name.zip',
        maxDownloads: 5,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Edit with password successful');
      console.log('📄 Response:', result.data);
      return result.data;
    } else {
      console.error('❌ Edit with password failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Edit with password test failed:', error);
    return null;
  }
}

// Test 6: Edit API with wrong password
async function testEditWithWrongPassword(fileId) {
  console.log('✏️ Testing edit API with wrong password...');
  
  try {
    const response = await fetch(`/api/v1/edit/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-file-password': 'wrongpass',
      },
      body: JSON.stringify({
        originalName: 'hacked-file.zip',
      }),
    });
    
    const result = await response.json();
    
    if (!result.success && result.error === 'Invalid password') {
      console.log('✅ Edit with wrong password correctly rejected');
      return true;
    } else {
      console.error('❌ Edit with wrong password should have been rejected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Edit with wrong password test failed:', error);
    return false;
  }
}

// Test 7: Edit API without password
async function testEditWithoutPassword(fileId) {
  console.log('✏️ Testing edit API without password...');
  
  try {
    const response = await fetch(`/api/v1/edit/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalName: 'hacked-file.zip',
      }),
    });
    
    const result = await response.json();
    
    if (!result.success && result.error === 'Password required') {
      console.log('✅ Edit without password correctly rejected');
      return true;
    } else {
      console.error('❌ Edit without password should have been rejected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Edit without password test failed:', error);
    return false;
  }
}

// Test 8: Delete API with correct password
async function testDeleteWithPassword(fileId, password) {
  console.log('🗑️ Testing delete API with correct password...');
  
  try {
    const response = await fetch(`/api/v1/delete/${fileId}`, {
      method: 'DELETE',
      headers: {
        'x-file-password': password,
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Delete with password successful');
      console.log('📄 Response:', result.data);
      return result.data;
    } else {
      console.error('❌ Delete with password failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Delete with password test failed:', error);
    return false;
  }
}

// Test 9: Delete API with wrong password
async function testDeleteWithWrongPassword(fileId) {
  console.log('🗑️ Testing delete API with wrong password...');
  
  try {
    const response = await fetch(`/api/v1/delete/${fileId}`, {
      method: 'DELETE',
      headers: {
        'x-file-password': 'wrongpass',
      },
    });
    
    const result = await response.json();
    
    if (!result.success && result.error === 'Invalid password') {
      console.log('✅ Delete with wrong password correctly rejected');
      return true;
    } else {
      console.error('❌ Delete with wrong password should have been rejected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Delete with wrong password test failed:', error);
    return false;
  }
}

// Test 10: Try to edit non-password-protected file
async function testEditNonPasswordFile(fileId) {
  console.log('✏️ Testing edit of non-password-protected file...');
  
  try {
    const response = await fetch(`/api/v1/edit/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-file-password': 'anypass',
      },
      body: JSON.stringify({
        originalName: 'hacked-file.txt',
      }),
    });
    
    const result = await response.json();
    
    if (!result.success && result.error === 'No password protection') {
      console.log('✅ Edit of non-password file correctly rejected');
      return true;
    } else {
      console.error('❌ Edit of non-password file should have been rejected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Edit non-password file test failed:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🎯 Starting comprehensive API ownership tests...\n');
  
  // Test 1: Upload with password
  const passwordFile = await testUploadWithPassword();
  if (!passwordFile) {
    console.log('❌ Password upload test failed, stopping tests');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Upload without password
  const noPasswordFile = await testUploadWithoutPassword();
  if (!noPasswordFile) {
    console.log('❌ No-password upload test failed, stopping tests');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Info with password
  const passwordFileInfo = await testInfoWithPassword(passwordFile.fileId, 'test123');
  if (!passwordFileInfo) {
    console.log('❌ Info with password test failed, stopping tests');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Info without password (should fail)
  const infoRejection = await testInfoWithoutPassword(passwordFile.fileId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: Edit with correct password
  const editSuccess = await testEditWithPassword(passwordFile.fileId, 'test123');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 6: Edit with wrong password
  const editWrongPass = await testEditWithWrongPassword(passwordFile.fileId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 7: Edit without password
  const editNoPass = await testEditWithoutPassword(passwordFile.fileId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 8: Try to edit non-password file
  const editNonPass = await testEditNonPasswordFile(noPasswordFile.fileId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 9: Delete with correct password
  const deleteSuccess = await testDeleteWithPassword(passwordFile.fileId, 'test123');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 10: Delete with wrong password
  const deleteWrongPass = await testDeleteWithWrongPassword(passwordFile.fileId);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Final results
  const allTestsPassed = infoRejection && editSuccess && editWrongPass && 
                        editNoPass && editNonPass && deleteSuccess && deleteWrongPass;
  
  if (allTestsPassed) {
    console.log('🎉 ALL OWNERSHIP TESTS PASSED! 🎉');
    console.log('✅ Password-based ownership working');
    console.log('✅ Edit/Delete protection working');
    console.log('✅ Non-password file protection working');
    console.log('✅ Security validation working');
    console.log('\n🚀 Advanced APIs are fully functional and secure!');
  } else {
    console.log('❌ Some ownership tests failed. Check the logs above.');
  }
}

// Start tests when script loads
console.log('📋 Advanced API test script loaded. Run runTests() to start testing.');
console.log('💡 You can also test individual functions:');
console.log('   - testUploadWithPassword()');
console.log('   - testInfoWithPassword()');
console.log('   - testEditWithPassword()');
console.log('   - testDeleteWithPassword()');

// Auto-run tests after a short delay
setTimeout(() => {
  console.log('\n🔄 Auto-running ownership tests in 3 seconds...');
  setTimeout(runTests, 3000);
}, 1000);
