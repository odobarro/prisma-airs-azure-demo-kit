// app/api/route.ts
import { NextResponse } from 'next/server';

/**
 * Next.js Backend API Route for Prisma AIRS (Portkey AI Gateway + Idira Engine)
 * 
 * Intercepts incoming chat prompts, applies FinOps token optimizations, injects
 * SecOps metadata to resolve "(not set)" user ID tracking in dashboards, and
 * catches Idira L7 security guardrail enforcement blocks.
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. FinOps Optimization: Extract the latest user query to maximize Semantic Cache hit rate
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

    // 2. Build lightweight context payload (System Prompt + Last User Query)
    const optimizedMessages = [
      { 
        role: 'system', 
        content: 'You are the virtual customer support assistant for NovaRetail Store. Only answer queries regarding products, stock, orders, and store policies.' 
      }
    ];

    if (lastUserMessage) {
      optimizedMessages.push(lastUserMessage);
    }

    // 3. Prepare Portkey AI Gateway Headers & Metadata Injection
    const gatewayUrl = process.env.PORTKEY_GATEWAY_URL || 'https://api.portkey.ai/v1';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-portkey-api-key': process.env.PORTKEY_API_KEY || '',
      'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY || '',
      
      // FINOPS & SECOPS METADATA: Injects '_user' to eliminate '(not set)' in Portkey & SCM dashboards
      'x-portkey-metadata': JSON.stringify({
        _user: 'chatbot-retail-public',
        vertical: 'retail',
        app_name: 'public-retail-portal',
        environment: 'demo-production',
        cloud_provider: 'azure',
        security_tier: 'high-enforcement'
      })
    };

    // Attach optional Idira Guardrail Configuration ID if present in env
    if (process.env.PORTKEY_CONFIG_ID) {
      headers['x-portkey-config'] = process.env.PORTKEY_CONFIG_ID;
    }

    // 4. Dispatch request to Prisma AIRS AI Gateway
    const response = await fetch(`${gatewayUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'azure-gpt4mini-demo',
        messages: optimizedMessages,
        temperature: 0.7,
        user: 'chatbot-retail-public' // Native OpenAI payload User ID tracking
      })
    });

    const data = await response.json();

    // 5. Intercept Prisma AIRS / Idira Security Policy Blocks (HTTP 446, 400, 403, or hooks_failed)
    const isSecurityBlock = 
      response.status === 446 || 
      response.status === 400 || 
      response.status === 403 || 
      data?.error?.type === 'hooks_failed';

    if (isSecurityBlock) {
      // Inspect query content to detect user language preference (Spanish vs. English)
      const userContent = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
      const isSpanish = /[áéíóúñ¿¡]/i.test(userContent) || 
                        /\b(hola|que|como|donde|cuanto|precio|envio|descuento|politica|gastos|robo|claves|script)\b/i.test(userContent);

      const blockMessage = isSpanish
        ? '🛡️ **Solicitud Bloqueada por Seguridad (Prisma AIRS)**\n\nEl motor de seguridad L7 (Idira Engine / Palo Alto Networks) ha interceptado un patrón de riesgo, inyección de prompt o intento de exfiltración. La llamada a Azure OpenAI ha sido cancelada.'
        : '🛡️ **Request Blocked by Security (Prisma AIRS)**\n\nThe L7 security engine (Idira Engine / Palo Alto Networks) intercepted a risk pattern, prompt injection, or exfiltration attempt. The request to Azure OpenAI has been canceled.';

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
    console.error('[Prisma AIRS Gateway Error]:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with AI Gateway' }, 
      { status: 500 }
    );
  }
}