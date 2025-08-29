#!/usr/bin/env node

/**
 * Test script for rate limiting system
 * Run with: node scripts/test-rate-limit.js
 */

const BASE_URL = 'http://localhost:3000'

async function testRateLimit() {
  console.log('🧪 Testing Rate Limiting System...\n')

  // Test 1: Normal request
  console.log('1️⃣ Testing normal request...')
  try {
    const response = await fetch(`${BASE_URL}/api/v1/admin/rate-limit`)
    const data = await response.json()
    console.log('✅ Response:', data)
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
  
  for (let i = 0; i < 35; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/v1/admin/rate-limit`)
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
    const response = await fetch(`${BASE_URL}/api/v1/admin/rate-limit`)
    const data = await response.json()
    console.log('✅ Response after wait:', data)
    console.log('📊 Rate Limit Headers:')
    console.log('   X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'))
    console.log('   X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'))
    console.log('   X-RateLimit-Reset:', response.headers.get('X-RateLimit-Reset'))
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 4: Admin endpoint to manage rate limiting
  console.log('4️⃣ Testing admin rate limit management...')
  try {
    const adminResponse = await fetch(`${BASE_URL}/api/v1/admin/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'stats',
        ip: '127.0.0.1',
        adminKey: process.env.ADMIN_SECRET_KEY || 'test-key'
      })
    })
    
    const adminData = await adminResponse.json()
    console.log('✅ Admin Response:', adminData)
  } catch (error) {
    console.log('❌ Admin Error:', error.message)
  }

  console.log('\n🎯 Rate Limiting Test Complete!')
  console.log('\n💡 Tips:')
console.log('   - Check Redis for rate limit keys: redis-cli -h 84.247.133.163 -p 6379 -a ZamDev999 keys "droply:rate_limit:*"')
console.log('   - Check blocked IPs: redis-cli -h 84.247.133.163 -p 6379 -a ZamDev999 keys "droply:blocked_ips:*"')
console.log('   - Check whitelist: redis-cli -h 84.247.133.163 -p 6379 -a ZamDev999 keys "droply:whitelist:*"')
console.log('   - Monitor Redis logs for rate limiting events')
}

// Run the test
testRateLimit().catch(console.error)
