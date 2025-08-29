// Application configuration
export const APP_CONFIG = {
  // Rate limiting configuration
  RATE_LIMIT: {
    // Default requests per minute for all APIs (30 req/min as requested)
    DEFAULT_REQUESTS_PER_MINUTE: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '30'),
    // Block duration in seconds when rate limit is exceeded
    DEFAULT_BLOCK_DURATION: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION || '300'), // 5 minutes
    
    // Specific endpoint limits (can override defaults)
    ENDPOINTS: {
      // Upload endpoint - more restrictive
      UPLOAD: {
        requestsPerMinute: 30,
        blockDuration: 600, // 10 minutes
        errorMessage: 'Upload rate limit exceeded. Please wait before uploading another file.'
      },
      // Download endpoint - more permissive for legitimate users
      DOWNLOAD: {
        requestsPerMinute: 50,
        blockDuration: 600, // 5 minutes
        errorMessage: 'Download rate limit exceeded. Please wait before downloading more files.'
      },
      // Info endpoint - moderate
      INFO: {
        requestsPerMinute: 50,
        blockDuration: 100,
        errorMessage: 'Info request rate limit exceeded. Please wait before making more requests.'
      },
      // Edit/Delete endpoints - restrictive for security
      EDIT: {
        requestsPerMinute: 20,
        blockDuration: 900, // 15 minutes
        errorMessage: 'Edit rate limit exceeded. Please wait before making more changes.'
      },
      DELETE: {
        requestsPerMinute: 15,
        blockDuration: 900, // 15 minutes
        errorMessage: 'Delete rate limit exceeded. Please wait before deleting more files.'
      }
    }
  },
  
  // Security configuration
  SECURITY: {
    // JWT configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    
    // Rate limiting configuration
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
    MAX_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '100'),
    
    // IP filtering
    WHITELISTED_IPS: (process.env.WHITELISTED_IPS || '').split(',').filter(Boolean),
    BLACKLISTED_IPS: (process.env.BLACKLISTED_IPS || '').split(',').filter(Boolean),
    
    // CORS configuration
    CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000,https://droply.com').split(','),
    
    // System token for internal APIs
    SYSTEM_DEFAULT_JWT: process.env.SYSTEM_DEFAULT_JWT || 'system-internal-token-change-in-production',
    
    // Disable whitelist in development for testing
    DISABLE_WHITELIST_IN_DEV: process.env.NODE_ENV === 'development',
    
    // Trusted proxy headers (for getting real client IP)
    TRUSTED_PROXIES: [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip'
    ]
  },
  
  // Environment detection
  ENVIRONMENT: {
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_TEST: process.env.NODE_ENV === 'test'
  }
} as const

// Helper function to get endpoint-specific rate limit config
export function getEndpointRateLimitConfig(endpoint: keyof typeof APP_CONFIG.RATE_LIMIT.ENDPOINTS) {
  const endpointConfig = APP_CONFIG.RATE_LIMIT.ENDPOINTS[endpoint]
  return {
    requestsPerMinute: endpointConfig.requestsPerMinute,
    blockDuration: endpointConfig.blockDuration,
    errorMessage: endpointConfig.errorMessage
  }
}

// Helper function to check if IP is whitelisted
export function isWhitelistedIP(ip: string): boolean {
  return (APP_CONFIG.SECURITY.WHITELISTED_IPS as readonly string[]).includes(ip)
}

// Helper function to check if IP is blacklisted
export function isBlacklistedIP(ip: string): boolean {
  return (APP_CONFIG.SECURITY.BLACKLISTED_IPS as readonly string[]).includes(ip)
}

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  if (APP_CONFIG.ENVIRONMENT.IS_PRODUCTION) {
    return {
      redisHost: 'localhost', // Use localhost Redis on server for performance
      redisPort: 6379,
      enableLogging: true,
      enableMetrics: true
    }
  }
  
  if (APP_CONFIG.ENVIRONMENT.IS_DEVELOPMENT) {
    return {
      redisHost: 'localhost',
      redisPort: 6379,
      enableLogging: true,
      enableMetrics: false
    }
  }
  
  // Test environment
  return {
    redisHost: 'localhost',
    redisPort: 6379,
    enableLogging: false,
    enableMetrics: false
  }
}
