#!/usr/bin/env node

/**
 * Test script for Info API
 * Run with: node scripts/test-info-api.js
 */

const BASE_URL = 'http://localhost:3000'

async function testInfoAPI() {
  console.log('🧪 Testing Info API...\n')

  // Test 1: Test with a valid file ID (you'll need to upload a file first)
  console.log('1️⃣ Testing info API with a valid file ID...')
  try {
    // First, let's upload a test file to get a valid ID
    const fileContent = 'This is a test file for info API testing'
    const file = new Blob([fileContent], { type: 'text/plain' })
    
    const formData = new FormData()
    formData.append('file', file, 'test-info.txt')
    formData.append('meta', JSON.stringify({
      password: 'test123',
      visibility: 'private',
      expiresIn: '1d',
      maxDownloads: 5,
      filename: 'test-info.txt',
      contentType: 'text/plain',
      size: file.size
    }))

    console.log('📤 Uploading test file...')
    const uploadResponse = await fetch(`${BASE_URL}/api/v1/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      console.log('❌ Upload failed:', errorData)
      return
    }

    const uploadData = await uploadResponse.json()
    const fileId = uploadData.fileId
    console.log('✅ File uploaded successfully!')
    console.log('📊 File ID:', fileId)

    console.log('\n📋 Now testing info API...')
    const infoResponse = await fetch(`${BASE_URL}/api/v1/info/${fileId}`)
    
    if (infoResponse.ok) {
      const infoData = await infoResponse.json()
      console.log('✅ Info API working!')
      console.log('📊 File info:', JSON.stringify(infoData.file, null, 2))
    } else {
      const errorData = await infoResponse.json()
      console.log('❌ Info API failed:', errorData)
    }

  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Test with an invalid file ID
  console.log('2️⃣ Testing info API with an invalid file ID...')
  try {
    const invalidId = 'invalid_id_123'
    const response = await fetch(`${BASE_URL}/api/v1/info/${invalidId}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('⚠️ Unexpected success with invalid ID:', data)
    } else {
      const errorData = await response.json()
      console.log('✅ Correctly rejected invalid ID:', errorData)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n🎯 Info API Test Complete!')
}

// Run the test
testInfoAPI().catch(console.error)
