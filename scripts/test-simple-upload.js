// Simple test script for upload API
console.log('🧪 Testing simple upload API...');

async function testSimpleUpload() {
  try {
    // Create a simple text file
    const testFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('isSingleFile', 'true');
    formData.append('expiresIn', '7d');
    // Don't add password or meta for single file
    
    console.log('📤 Sending upload request...');
    console.log('📄 FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const response = await fetch('http://localhost:3000/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Upload successful!');
      console.log('📄 Response:', result.data);
    } else {
      console.error('❌ Upload failed:', result.error);
      console.log('📄 Details:', result.details);
      if (result.receivedData) {
        console.log('📄 Received data:', result.receivedData);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testSimpleUpload();
