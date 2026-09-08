// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Retrieve allowed IP addresses from environment variables (supports comma-separated values)
  const allowedIpsString = process.env.ALLOWED_IP || '';
  const allowedList = allowedIpsString.split(',').map(ip => ip.trim());

  // 2. Extract real client IP address by parsing Vercel Edge proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip || 'unknown';

  // 3. Verify whether the client IP exists within the security allowlist
  if (!allowedList.includes(clientIp)) {
    console.log(`[Edge Security Firewall] Access denied for IP: ${clientIp}`);
    return new NextResponse(
      JSON.stringify({ 
        error: "Access Denied - Prisma AIRS Edge Security Block",
        detected_ip: clientIp // Temporarily exposes detected IP to facilitate allowlist configuration
      }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/retail/:path*', '/api/:path*'], // Enforces edge perimeter protection for both UI and API routes
};