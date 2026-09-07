import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Read the client IP from Vercel / Cloudflare edge proxy headers
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip;
  const allowedIp = process.env.ALLOWED_IP;

  // Enforce zero-trust IP check
  if (allowedIp && clientIp !== allowedIp) {
    return new NextResponse('Access Denied: IP Address Not Allowed', { status: 403 });
  }

  return NextResponse.next();
}

// Apply IP restriction to all application routes except static assets
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};