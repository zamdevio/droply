// 🚀 Pure in-memory rate limiting with TTL (no Redis needed)
import { NextRequest, NextResponse } from 'next/server'
import { APP_CONFIG, getEndpointRateLimitConfig } from '@/lib/config'

// 🎯 In-memory storage for rate limiting (5 minute TTL)
const RATE_LIMIT_CACHE = new Map<string, { 
  count: number; 
  resetTime: number; 
  blocked: boolean; 
  blockExpiry: number;
  lastAccess: number;
}>()

const WHITELIST_CACHE = new Map<string, { expiry: number }>()
const BLACKLIST_CACHE = new Map<string, { expiry: number }>()

// Cache TTL settings
const RATE_LIMIT_TTL = 5 * 60 * 1000 // 5 minutes
const WHITELIST_TTL = 10 * 60 * 1000 // 10 minutes  
const BLACKLIST_TTL = 60 * 60 * 1000 // 1 hour

// Cleanup intervals
setInterval(() => cleanupExpiredRecords(RATE_LIMIT_CACHE, RATE_LIMIT_TTL), 5 * 60 * 1000)
setInterval(() => cleanupExpiredRecords(WHITELIST_CACHE, WHITELIST_TTL), 10 * 60 * 1000)
setInterval(() => cleanupExpiredRecords(BLACKLIST_CACHE, BLACKLIST_TTL), 60 * 60 * 1000)

// Cleanup expired records
function cleanupExpiredRecords(cache: Map<string, any>, ttl: number) {
  const now = Date.now()
  Array.from(cache.entries()).forEach(([key, value]) => {
    if (value.expiry && value.expiry < now) {
      cache.delete(key)
    }
  })
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  blocked: boolean
  blockExpiry?: number
  message?: string
}

// Main rate limiting function
export async function checkRateLimit(req: NextRequest, clientIP: string): Promise<RateLimitResult> {
  try {
    // Get rate limit config for this request
    const config = getRequestRateLimitConfig(req)
    const { requestsPerMinute, blockDuration } = config
    
    console.log(`🎯 Rate limiting ${clientIP} for ${req.nextUrl.pathname}`)
    console.log(`📊 Config: ${requestsPerMinute} req/min, block: ${blockDuration}s`)
    
    // Check whitelist first (always allow)
    if (isWhitelistedIP(clientIP)) {
      console.log('✅ IP is whitelisted, allowing request')
      return {
        success: true,
        remaining: requestsPerMinute,
        resetTime: Date.now() + 60000,
        blocked: false
      }
    }
    
    // Check blacklist (always block)
    if (isBlacklistedIP(clientIP)) {
      console.log('🚫 IP is blacklisted, blocking request')
      return {
        success: false,
        remaining: 0,
        resetTime: 0,
        blocked: true,
        message: 'IP address is permanently blocked'
      }
    }
    
    // Create rate limit key
    const endpoint = detectEndpoint(req)
    const rateLimitKey = `rate_limit:${clientIP}:${endpoint || 'default'}`
    
    // Check current rate limit status
    const currentLimit = RATE_LIMIT_CACHE.get(rateLimitKey)
    const now = Date.now()
    
    if (currentLimit) {
      // Check if still blocked
      if (currentLimit.blocked && currentLimit.blockExpiry > now) {
        console.log('🚫 IP is still blocked from previous violation')
        return {
          success: false,
          remaining: 0,
          resetTime: currentLimit.blockExpiry,
          blocked: true,
          blockExpiry: Math.ceil((currentLimit.blockExpiry - now) / 1000),
          message: 'IP is temporarily blocked due to rate limit violations'
        }
      }
      
      // Check if reset time has passed
      if (currentLimit.resetTime <= now) {
        // Reset the counter
        currentLimit.count = 1
        currentLimit.resetTime = now + 60000 // 1 minute from now
        currentLimit.lastAccess = now
        console.log('🔄 Rate limit reset, starting fresh count')
      } else {
        // Increment counter
        currentLimit.count++
        currentLimit.lastAccess = now
        console.log(`📊 Rate limit count: ${currentLimit.count}/${requestsPerMinute}`)
      }
    } else {
      // First request from this IP
      RATE_LIMIT_CACHE.set(rateLimitKey, {
        count: 1,
        resetTime: now + 60000,
        blocked: false,
        blockExpiry: 0,
        lastAccess: now
      })
      console.log('🆕 First request from IP, initializing rate limit')
    }
    
    const currentRecord = RATE_LIMIT_CACHE.get(rateLimitKey)!
    
    // Check if rate limit exceeded
    if (currentRecord.count > requestsPerMinute) {
      // Block the IP
      currentRecord.blocked = true
      currentRecord.blockExpiry = now + (blockDuration * 1000)
      
      console.log(`🚨 Rate limit exceeded! Blocking IP for ${blockDuration} seconds`)
      
      return {
        success: false,
        remaining: 0,
        resetTime: currentRecord.blockExpiry,
        blocked: true,
        blockExpiry: blockDuration,
        message: `Rate limit exceeded. IP blocked for ${blockDuration} seconds.`
      }
    }
    
    // Rate limit passed
    const remaining = Math.max(0, requestsPerMinute - currentRecord.count)
    console.log(`✅ Rate limit passed. Remaining: ${remaining}`)
    
    return {
      success: true,
      remaining,
      resetTime: currentRecord.resetTime,
      blocked: false
    }
    
  } catch (error) {
    console.error('❌ Rate limit check error:', error)
    // On error, allow the request but log the error
    return {
      success: true,
      remaining: 30,
      resetTime: Date.now() + 60000,
      blocked: false
    }
  }
}

// Whitelist management
export function addToWhitelist(ip: string, duration: number = WHITELIST_TTL) {
  WHITELIST_CACHE.set(ip, { expiry: Date.now() + duration })
  console.log(`✅ Added ${ip} to whitelist for ${duration / 1000}s`)
}

export function removeFromWhitelist(ip: string) {
  WHITELIST_CACHE.delete(ip)
  console.log(`❌ Removed ${ip} from whitelist`)
}

export function isWhitelistedIP(ip: string): boolean {
  const cached = WHITELIST_CACHE.get(ip)
  if (cached && cached.expiry > Date.now()) {
    return true
  }
  // Also check config whitelist
  return (APP_CONFIG.SECURITY.WHITELISTED_IPS as readonly string[]).includes(ip)
}

// Blacklist management
export function addToBlacklist(ip: string, duration: number = BLACKLIST_TTL) {
  BLACKLIST_CACHE.set(ip, { expiry: Date.now() + duration })
  console.log(`🚫 Added ${ip} to blacklist for ${duration / 1000}s`)
}

export function removeFromBlacklist(ip: string) {
  BLACKLIST_CACHE.delete(ip)
  console.log(`✅ Removed ${ip} from blacklist`)
}

export function isBlacklistedIP(ip: string): boolean {
  const cached = BLACKLIST_CACHE.get(ip)
  if (cached && cached.expiry > Date.now()) {
    return true
  }
  // Also check config blacklist
  return (APP_CONFIG.SECURITY.BLACKLISTED_IPS as readonly string[]).includes(ip)
}

// Utility functions
function detectEndpoint(req: NextRequest): keyof typeof APP_CONFIG.RATE_LIMIT.ENDPOINTS | null {
  const path = req.nextUrl.pathname
  
  if (path.includes('/upload')) return 'UPLOAD'
  if (path.includes('/download')) return 'DOWNLOAD'
  if (path.includes('/info')) return 'INFO'
  if (path.includes('/edit')) return 'EDIT'
  if (path.includes('/delete')) return 'DELETE'
  
  return null
}

function getRequestRateLimitConfig(req: NextRequest) {
  const endpoint = detectEndpoint(req)
  
  if (endpoint) {
    return getEndpointRateLimitConfig(endpoint)
  }
  
  return {
    requestsPerMinute: APP_CONFIG.RATE_LIMIT.DEFAULT_REQUESTS_PER_MINUTE,
    blockDuration: APP_CONFIG.RATE_LIMIT.DEFAULT_BLOCK_DURATION,
    errorMessage: 'Rate limit exceeded. Please wait before making more requests.'
  }
}

// Export cache for monitoring/debugging
export function getCacheStats() {
  return {
    rateLimit: RATE_LIMIT_CACHE.size,
    whitelist: WHITELIST_CACHE.size,
    blacklist: BLACKLIST_CACHE.size,
    total: RATE_LIMIT_CACHE.size + WHITELIST_CACHE.size + BLACKLIST_CACHE.size
  }
}

// Clear all caches (useful for testing)
export function clearAllCaches() {
  RATE_LIMIT_CACHE.clear()
  WHITELIST_CACHE.clear()
  BLACKLIST_CACHE.clear()
  console.log('🧹 All caches cleared')
}
