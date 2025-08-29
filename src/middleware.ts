import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit/edge";
import { getClientIP } from "@/lib/rateLimit/utils";

// This middleware will run for all API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Skip rate limiting for internal APIs to prevent infinite loops
  if (pathname.startsWith('/api/internal/')) {
    console.log('🔄 Skipping rate limiting for internal API:', pathname);
    return NextResponse.next();
  }
  
  // Skip rate limiting for health check and monitoring endpoints
  if (pathname.includes('/health') || pathname.includes('/status') || pathname.includes('/metrics')) {
    console.log('🔄 Skipping rate limiting for health/monitoring endpoint:', pathname);
    return NextResponse.next();
  }
  
  console.log('🚀 MIDDLEWARE CALLED for API route:', pathname);
  console.log('🔍 Request method:', request.method);
  console.log('🌐 Full pathname:', pathname);
  
  try {
    // Get client IP
    const clientIP = getClientIP(request);
    console.log('🎯 Client IP detected:', clientIP);
    
    // Check rate limit using our in-memory system
    console.log('⚡ Checking rate limit...');
    const rateLimitResult = await checkRateLimit(request, clientIP);
    
    if (!rateLimitResult.success || rateLimitResult.blocked) {
      // Rate limit exceeded or IP blocked
      console.log('🚨 Rate limit exceeded or IP blocked:', rateLimitResult);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitResult.message || 'Too many requests',
          blocked: true,
          blockExpiry: rateLimitResult.blockExpiry,
          retryAfter: rateLimitResult.blockExpiry
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.blockExpiry?.toString() || '300',
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Blocked': 'true'
          }
        }
      );
    }
    
    // Rate limit passed, continue to API route
    console.log('✅ Rate limit passed, continuing to API route');
    const response = NextResponse.next();
    response.headers.set('X-Middleware-Called', 'true');
    response.headers.set('X-RateLimit-Limit', '30');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    console.log('🎯 Middleware completed, status:', response.status);
    return response;
    
  } catch (error) {
    console.error('❌ Middleware error:', error);
    // On error, allow the request to proceed but log it
    const response = NextResponse.next();
    response.headers.set('X-Middleware-Error', 'true');
    return response;
  }
}
