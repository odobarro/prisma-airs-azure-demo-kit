// app/api/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Extract ONLY the last user message to optimize payload size and stabilize vector caching
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

    // 2. Build lightweight payload (System Prompt + Last User Query)
    const optimizedMessages = [
      { 
        role: 'system', 
        content: 'You are the virtual customer support assistant for NovaRetail Store. Only answer queries regarding products, stock, orders, and store policies.' 
      }
    ];

    if (lastUserMessage) {
      optimizedMessages.push(lastUserMessage);
    }

    // 3. Dispatch request to Prisma AIRS AI Gateway
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
        messages: optimizedMessages
      })
    });

    const data = await response.json();

    // 4. Intercept Prisma AIRS Security Guardrail Blocks (HTTP 446 or hooks_failed)
    if (response.status === 446 || data?.error?.type === 'hooks_failed') {
      // Inspect query content to detect user language preference (Spanish vs. English)
      const userContent = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
      const isSpanish = /[áéíóúñ¿¡]/i.test(userContent) || 
                        /\b(hola|que|como|donde|cuanto|precio|envio|descuento|politica|gastos)\b/i.test(userContent);

      const blockMessage = isSpanish
        ? '🛡️ **Solicitud Bloqueada por Seguridad**\n\nEl sistema de protección perimetral Prisma AIRS (Palo Alto Networks) ha detectado un patrón de riesgo o violación de política en tu consulta. La llamada a Azure OpenAI ha sido cancelada.'
        : '🛡️ **Request Blocked by Security**\n\nThe Prisma AIRS perimetral security system (Palo Alto Networks) detected a risk pattern or policy violation in your query. The request to Azure OpenAI has been canceled.';

      return NextResponse.json({
        choices: [
          {
            message: {
              role: 'assistant',
              content: blockMessage
            }
          }
        ]
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to communicate with AI Gateway' }, 
      { status: 500 }
    );
  }
}