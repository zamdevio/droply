#!/usr/bin/env node

/**
 * Test script for Edge-compatible rate limiting system
 * Run with: node scripts/test-edge-rate-limit.js
 */

const BASE_URL = 'http://localhost:3000'

async function testEdgeRateLimit() {
  console.log('🧪 Testing Edge-Compatible Rate Limiting System...\n')

  // Test 1: Normal request
  console.log('1️⃣ Testing normal request...')
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

  // Test 2: Multiple rapid requests to trigger rate limiting
  console.log('2️⃣ Testing rapid requests to trigger rate limiting...')
  const promises = []
  
  for (let i = 0; i < 15; i++) {
    promises.push(
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

  const results = await Promise.all(promises)
  
  console.log('📊 Results:')
  results.forEach((result, index) => {
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

  // Test 3: Wait and try again
  console.log('3️⃣ Waiting 5 seconds and testing again...')
  await new Promise(resolve => setTimeout(resolve, 5000))
  
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
        filename: 'test-after-wait.txt',
        contentType: 'text/plain',
        size: 1024
      })
    })
    
    console.log('✅ Response after wait:', response.status)
    console.log('📊 Rate Limit Headers:')
    console.log('   X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'))
    console.log('   X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'))
    console.log('   X-RateLimit-Reset:', response.headers.get('X-RateLimit-Reset'))
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n🎯 Edge Rate Limiting Test Complete!')
  console.log('\n💡 Notes:')
  console.log('   - This uses in-memory rate limiting for Edge Runtime compatibility')
  console.log('   - In production, use Upstash Redis or similar Edge-compatible service')
  console.log('   - Rate limits are per IP address')
  console.log('   - Blocked IPs are stored in memory and cleaned up automatically')
}

// Run the test
testEdgeRateLimit().catch(console.error)
