import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Extraer la IP origen inyectada por la Edge Network de Vercel
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : request.headers.get('x-real-ip') || '';

  const allowedIpsString = process.env.ALLOWED_IPS || '';
  const allowedIps = allowedIpsString.split(',').map((ip) => ip.trim()).filter(Boolean);

  // Permitir tráfico si la lista no está configurada o si la IP coincide
  if (allowedIps.length === 0 || allowedIps.includes(clientIp)) {
    return NextResponse.next();
  }

  // Bloquear acceso no autorizado con formato de error SecOps
  return new NextResponse(
    JSON.stringify({
      error: 'Access Denied (403)',
      message: 'IP address strictly blocked by Prisma AIRS SecOps policy.',
      clientIp,
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Interceptar todas las rutas excepto archivos estáticos del compilador
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};