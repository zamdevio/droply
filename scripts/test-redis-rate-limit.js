#!/usr/bin/env node

/**
 * Test script for Redis-based Rate Limiting System
 * Demonstrates: Rate limiting, suspicious behavior tracking, IP blocking, and stats
 * Run with: node scripts/test-redis-rate-limit.js
 */

const BASE_URL = 'http://localhost:3000'

async function testRedisRateLimit() {
  console.log('🧪 Testing Redis-based Rate Limiting System...\n')

  // Test 1: Basic rate limiting
  console.log('1️⃣ Testing basic rate limiting...')
  try {
    for (let i = 1; i <= 35; i++) {
      const response = await fetch(`${BASE_URL}/api/v1/info/test123`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.status === 429) {
        console.log(`✅ Rate limit hit after ${i} requests (expected around 30)`)
        const data = await response.json()
        console.log(`   Block duration: ${data.blockExpiry} seconds`)
        console.log(`   Message: ${data.message}`)
        break
      }
      
      if (i % 10 === 0) {
        console.log(`   Request ${i}: ${response.status}`)
      }
    }
  } catch (error) {
    console.error('❌ Error during rate limit test:', error)
  }
  console.log('\n')

  // Test 2: Check suspicious behavior score
  console.log('2️⃣ Testing suspicious behavior tracking...')
  try {
    const response = await fetch(`${BASE_URL}/api/internal/redis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true',
        'Authorization': `Bearer ${process.env.SYSTEM_REDIS_TOKEN || 'system_token'}`
      },
      body: JSON.stringify({
        action: 'getSuspiciousScore',
        data: { key: '127.0.0.1:INFO' }
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Suspicious behavior score retrieved:')
      console.log(`   IP: ${data.result.ip}`)
      console.log(`   Suspicious Score: ${data.result.suspiciousScore}`)
      console.log(`   Is Blocked: ${data.result.isBlocked}`)
      console.log(`   Is Permanently Blocked: ${data.result.isPermanentlyBlocked}`)
    } else {
      console.error('❌ Failed to get suspicious score:', response.status)
    }
  } catch (error) {
    console.error('❌ Error during suspicious score test:', error)
  }
  console.log('\n')

  // Test 3: Get comprehensive rate limit stats
  console.log('3️⃣ Testing comprehensive rate limit stats...')
  try {
    const response = await fetch(`${BASE_URL}/api/internal/redis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true',
        'Authorization': `Bearer ${process.env.SYSTEM_REDIS_TOKEN || 'system_token'}`
      },
      body: JSON.stringify({
        action: 'getRateLimitStats',
        data: { key: '127.0.0.1:INFO' }
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Rate limit stats retrieved:')
      console.log(`   IP: ${data.result.ip}`)
      console.log(`   Current Window Count: ${data.result.currentWindow.count}`)
      console.log(`   Remaining Requests: ${data.result.currentWindow.remaining}`)
      console.log(`   Suspicious Score: ${data.result.suspiciousScore}`)
      console.log(`   Total Request Pattern: ${data.result.requestPattern.totalRequests} requests`)
    } else {
      console.error('❌ Failed to get rate limit stats:', response.status)
    }
  } catch (error) {
    console.error('❌ Error during stats test:', error)
  }
  console.log('\n')

  // Test 4: Test unblocking (if blocked)
  console.log('4️⃣ Testing IP unblocking...')
  try {
    const response = await fetch(`${BASE_URL}/api/internal/redis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true',
        'Authorization': `Bearer ${process.env.SYSTEM_REDIS_TOKEN || 'system_token'}`
      },
      body: JSON.stringify({
        action: 'unblockIP',
        data: { key: '127.0.0.1:INFO' }
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ IP unblocked:', data.result.message)
    } else {
      console.error('❌ Failed to unblock IP:', response.status)
    }
  } catch (error) {
    console.error('❌ Error during unblock test:', error)
  }
  console.log('\n')

  // Test 5: Test after unblocking
  console.log('5️⃣ Testing API access after unblocking...')
  try {
    const response = await fetch(`${BASE_URL}/api/v1/info/test123`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      console.log('✅ API access restored after unblocking')
    } else {
      console.log(`❌ API still blocked: ${response.status}`)
    }
  } catch (error) {
    console.error('❌ Error during post-unblock test:', error)
  }
  console.log('\n')

  console.log('🎯 Redis-based Rate Limiting System Test Complete!')
  console.log('📊 Check your Redis console for detailed tracking data')
  console.log('🔒 The system now tracks suspicious behavior and applies dynamic blocking')
}

testRedisRateLimit().catch(console.error)
