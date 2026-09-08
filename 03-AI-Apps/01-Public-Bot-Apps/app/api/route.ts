// app/api/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Extraemos ÚNICAMENTE el último mensaje enviado por el usuario
    // Esto limpia el historial y estabiliza el vector para el Caché Semántico
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

    // 2. Construimos el payload optimizado (System + Última pregunta)
    const optimizedMessages = [
      { 
        role: 'system', 
        content: 'You are the virtual customer support assistant for NovaRetail Store. Only answer queries regarding products, stock, orders, and store policies.' 
      }
    ];

    if (lastUserMessage) {
      optimizedMessages.push(lastUserMessage);
    }

    const response = await fetch(`${process.env.PORTKEY_GATEWAY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-portkey-api-key': process.env.PORTKEY_API_KEY || '',
        'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY || '',
        
        // FINOPS & OBSERVABILITY METADATA (Prisma AIRS / Strata Cloud Manager)
        'x-portkey-custom-metadata': JSON.stringify({
          vertical: 'retail',
          app_name: 'public-retail-portal',
          environment: 'demo',
          cloud_provider: 'azure'
        })
      },
      body: JSON.stringify({
        model: 'azure-gpt4mini-demo',
        messages: optimizedMessages // <--- Aquí mandamos el array ya filtrado
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to communicate with AI Gateway' }, { status: 500 });
  }
}