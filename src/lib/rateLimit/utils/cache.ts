// Cache management utilities for rate limiting
export interface CacheEntry<T> {
  data: T
  expiry: number
  lastAccess: number
}

export class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private ttl: number
  private cleanupInterval: number

  constructor(ttl: number, cleanupInterval: number = ttl * 2) {
    this.ttl = ttl
    this.cleanupInterval = cleanupInterval
    
    // Start cleanup timer
    setInterval(() => this.cleanup(), cleanupInterval)
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl,
      lastAccess: Date.now()
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (entry.expiry <= now) {
      this.cache.delete(key)
      return null
    }

    // Update last access
    entry.lastAccess = now
    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  cleanup(): void {
    const now = Date.now()
    let deleted = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key)
        deleted++
      }
    }
    
    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} expired cache entries`)
    }
  }

  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0
    
    for (const entry of this.cache.values()) {
      if (entry.expiry <= now) {
        expired++
      } else {
        active++
      }
    }
    
    return {
      total: this.cache.size,
      active,
      expired,
      ttl: this.ttl,
      cleanupInterval: this.cleanupInterval
    }
  }
}
