import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Obtenemos las IPs permitidas (soporta separadas por comas)
  const allowedIpsString = process.env.ALLOWED_IP || '';
  const allowedList = allowedIpsString.split(',').map(ip => ip.trim());

  // 2. Extraemos la IP real del cliente limpiando los proxies de Vercel Edge
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip || 'unknown';

  // 3. Verificamos si la IP del cliente está en nuestra lista blanca
  if (!allowedList.includes(clientIp)) {
    console.log(`[Security Firewall] Acceso denegado a la IP: ${clientIp}`);
    return new NextResponse(
      JSON.stringify({ 
        error: "Access Denied - Prisma AIRS Edge Security Block",
        detected_ip: clientIp // Mostramos la IP temporalmente para que sepas cuál añadir
      }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/retail/:path*', '/api/:path*'], // Protege tanto la UI como la API
};