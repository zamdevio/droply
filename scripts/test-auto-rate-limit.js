#!/usr/bin/env node

/**
 * Test script for Auto-Detecting Rate Limiting System
 * Run with: node scripts/test-auto-rate-limit.js
 */

const BASE_URL = 'http://localhost:3000'

async function testAutoRateLimit() {
  console.log('🧪 Testing Auto-Detecting Rate Limiting System...\n')

  // Test 1: Upload endpoint (should get UPLOAD config: 10 req/min)
  console.log('1️⃣ Testing UPLOAD endpoint (10 req/min limit)...')
  try {
    const response = await fetch(`${BASE_URL}/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: 'test123',
        visibility: 'private',
        expiresIn: '7d',
        maxDownloads: 10,
        filename: 'test.txt',
        contentType: 'text/plain',
        size: 1024
      })
    })
    
    console.log('✅ Response status:', response.status)
    console.log('📊 Rate Limit Headers:')
    console.log('   X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'))
    console.log('   X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'))
    console.log('   X-RateLimit-Reset:', response.headers.get('X-RateLimit-Reset'))
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Multiple upload requests to trigger rate limiting
  console.log('2️⃣ Testing rapid UPLOAD requests (should hit 10 req/min limit)...')
  const uploadPromises = []
  
  for (let i = 0; i < 12; i++) {
    uploadPromises.push(
      fetch(`${BASE_URL}/api/v1/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'test123',
          visibility: 'private',
          expiresIn: '7d',
          maxDownloads: 10,
          filename: `test${i}.txt`,
          contentType: 'text/plain',
          size: 1024
        })
      })
        .then(async (response) => {
          const data = await response.json()
          return {
            status: response.status,
            data,
            remaining: response.headers.get('X-RateLimit-Remaining'),
            blocked: response.headers.get('X-RateLimit-Blocked')
          }
        })
        .catch(error => ({ error: error.message }))
    )
  }

  const uploadResults = await Promise.all(uploadPromises)
  
  console.log('📊 UPLOAD Results:')
  uploadResults.forEach((result, index) => {
    if (result.error) {
      console.log(`   Request ${index + 1}: ❌ ${result.error}`)
    } else if (result.status === 429) {
      console.log(`   Request ${index + 1}: 🚫 Rate Limited (${result.status})`)
      if (result.data.blocked) {
        console.log(`      🔒 IP Blocked for ${result.data.blockExpiry} seconds`)
      }
    } else {
      console.log(`   Request ${index + 1}: ✅ Success (${result.status}) - Remaining: ${result.remaining}`)
    }
  })

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 3: Test a different endpoint (should get default 30 req/min)
  console.log('3️⃣ Testing INFO endpoint (60 req/min limit)...')
  try {
    const response = await fetch(`${BASE_URL}/api/v1/info/test123`, {
      method: 'GET'
    })
    
    console.log('✅ Response status:', response.status)
    console.log('📊 Rate Limit Headers:')
    console.log('   X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'))
    console.log('   X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'))
    console.log('   X-RateLimit-Reset:', response.headers.get('X-RateLimit-Reset'))
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 4: Test unknown endpoint (should get default 30 req/min)
  console.log('4️⃣ Testing unknown endpoint (should get default 30 req/min)...')
  try {
    const response = await fetch(`${BASE_URL}/api/v1/unknown`, {
      method: 'GET'
    })
    
    console.log('✅ Response status:', response.status)
    console.log('📊 Rate Limit Headers:')
    console.log('   X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'))
    console.log('   X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'))
    console.log('   X-RateLimit-Reset:', response.headers.get('X-RateLimit-Reset'))
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n🎯 Auto-Detecting Rate Limiting Test Complete!')
  console.log('\n💡 How It Works:')
  console.log('   - System automatically detects endpoints from URL paths')
  console.log('   - UPLOAD: 10 req/min (more restrictive)')
  console.log('   - DOWNLOAD: 5 req/min (very restrictive)')
  console.log('   - INFO: 60 req/min (permissive)')
  console.log('   - EDIT: 20 req/min (moderate)')
  console.log('   - DELETE: 15 req/min (moderate)')
  console.log('   - Unknown endpoints: 30 req/min (default)')
  console.log('\n🚀 Future-Proof:')
  console.log('   - Add new endpoints to config.ts ENDPOINTS section')
  console.log('   - System automatically applies their limits')
  console.log('   - No code changes needed in rate limiting logic!')
}

// Run the test
testAutoRateLimit().catch(console.error)
