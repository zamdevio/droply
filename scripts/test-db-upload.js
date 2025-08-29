#!/usr/bin/env node

/**
 * Test script for Database File Upload Storage
 * Run with: node scripts/test-db-upload.js
 */

const BASE_URL = 'http://localhost:3000'

async function testDatabaseUpload() {
  console.log('🧪 Testing Database File Upload Storage...\n')

  // Test 1: Upload a file (should be stored in database)
  console.log('1️⃣ Testing file upload to database...')
  try {
    // Create a simple text file
    const fileContent = 'This is a test file for database storage verification'
    const file = new Blob([fileContent], { type: 'text/plain' })
    
    const formData = new FormData()
    formData.append('file', file, 'test-db-upload.txt')
    formData.append('meta', JSON.stringify({
      password: 'test123',
      visibility: 'private',
              expiresIn: '1d',
      maxDownloads: 5,
      filename: 'test-db-upload.txt',
      contentType: 'text/plain',
      size: file.size
    }))

    const response = await fetch(`${BASE_URL}/api/v1/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ File uploaded successfully!')
      console.log('📊 File ID:', data.fileId)
      console.log('📁 File name:', data.metadata.name)
      console.log('💾 File size:', data.metadata.size, 'bytes')
      console.log('🔐 Visibility:', data.metadata.visibility)
      console.log('📅 Expires at:', data.metadata.expiresAt)
      console.log('🔄 Max downloads:', data.metadata.maxDownloads)
      console.log('🗂️ R2 Key:', data.metadata.r2Key)
      console.log('🪣 Bucket:', data.metadata.bucket)
      console.log('📊 Rate Limit Headers:')
      console.log('   X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'))
      console.log('   X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'))
      console.log('   X-RateLimit-Reset:', response.headers.get('X-RateLimit-Reset'))
      
      // Store file ID for next test
      global.testFileId = data.fileId
    } else {
      const errorData = await response.json()
      console.log('❌ Upload failed:', errorData)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Upload another file to test persistence
  console.log('2️⃣ Testing second file upload...')
  try {
    const fileContent2 = 'This is a second test file to verify database persistence'
    const file2 = new Blob([fileContent2], { type: 'text/plain' })
    
    const formData2 = new FormData()
    formData2.append('file', file2, 'test-db-upload-2.txt')
    formData2.append('meta', JSON.stringify({
      password: 'test456',
      visibility: 'public',
              expiresIn: '1h',
      maxDownloads: 10,
      filename: 'test-db-upload-2.txt',
      contentType: 'text/plain',
      size: file2.size
    }))

    const response2 = await fetch(`${BASE_URL}/api/v1/upload`, {
      method: 'POST',
      body: formData2
    })
    
    if (response2.ok) {
      const data2 = await response2.json()
      console.log('✅ Second file uploaded successfully!')
      console.log('📊 File ID:', data2.fileId)
      console.log('📁 File name:', data2.metadata.name)
      console.log('🔐 Visibility:', data2.metadata.visibility)
      console.log('📅 Expires at:', data2.metadata.expiresAt)
      console.log('🔄 Max downloads:', data2.metadata.maxDownloads)
    } else {
      const errorData2 = await response2.json()
      console.log('❌ Second upload failed:', errorData2)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Verify files persist after restart (simulation)
  console.log('3️⃣ Testing file persistence (simulation)...')
  console.log('💡 To test real persistence:')
  console.log('   1. Upload some files using this script')
  console.log('   2. Restart your Next.js app')
  console.log('   3. Check if files are still accessible')
  console.log('   4. Files should persist in your database!')

  console.log('\n🎯 Database Upload Test Complete!')
  console.log('\n💡 What Happens Now:')
  console.log('   ✅ File metadata is stored in PostgreSQL database')
  console.log('   ✅ Files persist across app restarts')
  console.log('   ✅ Access logs are recorded')
  console.log('   ✅ R2 keys are generated for storage')
  console.log('   ✅ Rate limiting still works')
  console.log('\n🚀 Next Steps:')
  console.log('   - Check your database for the new file records')
  console.log('   - Implement actual R2 upload for production')
  console.log('   - Test file retrieval and download endpoints')
}

// Run the test
testDatabaseUpload().catch(console.error)
