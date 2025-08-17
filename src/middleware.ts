import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = { matcher: ["/api/:path*"] };

// Simple rate limiting for now - can be enhanced later
export async function middleware(req: NextRequest) {
  // For now, just pass through - rate limiting can be added later
  // when we have Redis set up
  return NextResponse.next();
}
