// Redis configuration for rate limiting
export const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_MINUTE: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  BLOCK_DURATION: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION || '300'),
  WINDOW_SIZE: parseInt(process.env.RATE_LIMIT_WINDOW_SIZE || '60'),
  PREFIXES: {
    RATE_LIMIT: process.env.RATE_LIMIT_PREFIX || 'droply:rate_limit',
    BLOCKED_IPS: process.env.BLOCKED_IPS_PREFIX || 'droply:blocked_ips',
    WHITELIST: process.env.WHITELIST_PREFIX || 'droply:whitelist'
  }
} as const;


// Use your existing Redis client implementation
import { getRedis } from './redis/index'

// Export the getRedis function for rate limiting
export const getRedisClient = getRedis

// Close Redis connection (useful for cleanup)
export const closeRedis = async (): Promise<void> => {
  try {
    const client = await getRedisClient()
    await client.quit()
  } catch (error) {
    console.error('Failed to close Redis connection:', error)
  }
}

// Health check for Redis
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const client = await getRedisClient()
    await client.ping()
    return true
  } catch {
    return false
  }
}
