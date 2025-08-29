// IP address utility functions for rate limiting
import { NextRequest } from 'next/server'

// Get client IP address (Edge-compatible)
export function getClientIP(req: NextRequest): string {
  // Check for forwarded headers first
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map((ip: string) => ip.trim())
    return ips[0] || 'unknown'
  }
  
  // Check for real IP header
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Check for CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }
  
  // Fallback
  return 'unknown'
}

// Validate IP address format
export function isValidIP(ip: string): boolean {
  if (ip === 'unknown' || ip === 'localhost') return true
  
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  if (ipv4Regex.test(ip)) return true
  
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  if (ipv6Regex.test(ip)) return true
  
  return false
}

// Get IP range for subnet blocking
export function getIPRange(ip: string): string {
  if (ip === 'unknown' || ip === 'localhost') return ip
  
  // For IPv4, get /24 subnet
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
    }
  }
  
  return ip
}
