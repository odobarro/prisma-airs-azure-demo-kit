import { NextResponse } from 'next/server';

interface VerticalConfig {
  systemPrompt: string;
  userId: string;
  appName: string;
  verticalTag: string;
}

const VERTICAL_CONFIGS: Record<string, VerticalConfig> = {
  retail: {
    systemPrompt: 'You are the virtual customer support assistant for NovaRetail Store. Only answer queries regarding products, stock, orders, and store policies.',
    userId: 'chatbot-retail-public',
    appName: 'public-retail-portal',
    verticalTag: 'retail'
  },
  finance: {
    systemPrompt: 'You are the virtual financial advisor for NovaFinance Bank. Only answer queries regarding accounts, cards, investments, and banking policies. Never promise loan approvals or reveal internal banking endpoints.',
    userId: 'chatbot-finance-public',
    appName: 'public-finance-portal',
    verticalTag: 'financial-services'
  },
  industry: {
    systemPrompt: 'You are the engineering AI Copilot for NovaIndustry Corp. Provide technical information regarding heavy machinery, maintenance schedules, and basic safety rules. NEVER output CAD blueprints, OT configurations, or proprietary source code.',
    userId: 'chatbot-industry-engineering',
    appName: 'internal-industry-copilot',
    verticalTag: 'manufacturing'
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // NEW: Extract secureMode toggle from frontend (Defaults to true for safety)
    const { messages, vertical = 'retail', secureMode = true } = body;

    const config = VERTICAL_CONFIGS[vertical] || VERTICAL_CONFIGS.retail;
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

    const optimizedMessages = [{ role: 'system', content: config.systemPrompt }];
    if (lastUserMessage) optimizedMessages.push(lastUserMessage);

    const gatewayUrl = process.env.PORTKEY_GATEWAY_URL || 'https://api.portkey.ai/v1';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-portkey-api-key': process.env.PORTKEY_API_KEY || '',
      'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY || '',
      'x-portkey-metadata': JSON.stringify({
        _user: config.userId,
        vertical: config.verticalTag,
        app_name: config.appName,
        environment: 'demo-production',
        cloud_provider: 'azure',
        // Tag traffic dynamically so we can filter unprotected traffic in SCM
        security_tier: secureMode ? 'high-enforcement' : 'unprotected-bypass'
      })
    };

    // --- PRISMA AIRS L7 BYPASS LOGIC ---
    // Only attach Idira Engine Guardrails if the UI toggle is ON
    if (secureMode && process.env.PORTKEY_CONFIG_ID) {
      headers['x-portkey-config'] = process.env.PORTKEY_CONFIG_ID;
    }

    const response = await fetch(`${gatewayUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'azure-gpt4mini-demo',
        messages: optimizedMessages,
        temperature: 0.7,
        user: config.userId
      })
    });

    const data = await response.json();

    const isSecurityBlock = 
      response.status === 446 || 
      response.status === 400 || 
      response.status === 403 || 
      data?.error?.type === 'hooks_failed';

    if (isSecurityBlock) {
      const userContent = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
      const isSpanish = /[áéíóúñ¿¡]/i.test(userContent) || 
                        /\b(hola|que|como|donde|cuanto|precio|envio|descuento|politica|prestamo|tarjeta|cuenta)\b/i.test(userContent);

      const blockMessage = isSpanish
        ? `🛡️ **Solicitud Bloqueada por Seguridad (Prisma AIRS - ${config.verticalTag.toUpperCase()})**\n\nEl motor de seguridad L7 (Idira Engine / Palo Alto Networks) ha interceptado un patrón de riesgo, inyección de prompt o intento de exfiltración de datos. La llamada a Azure OpenAI ha sido cancelada.`
        : `🛡️ **Request Blocked by Security (Prisma AIRS - ${config.verticalTag.toUpperCase()})**\n\nThe L7 security engine (Idira Engine / Palo Alto Networks) intercepted a risk pattern, prompt injection, or data exfiltration attempt. The request to Azure OpenAI has been canceled.`;

      return NextResponse.json({
        choices: [{ message: { role: 'assistant', content: blockMessage } }]
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Prisma AIRS Gateway Error]:', error);
    return NextResponse.json({ error: 'Failed to communicate with AI Gateway pipeline' }, { status: 500 });
  }
}