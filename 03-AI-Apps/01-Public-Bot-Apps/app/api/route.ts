// app/api/route.ts
import { NextResponse } from 'next/server';
import Portkey from 'portkey-ai';

// Initialize Portkey client connected to Prisma AIRS AI Gateway
const portkey = new Portkey({
  apiKey: process.env.PORTKEY_API_KEY || '',
  virtualKey: process.env.PORTKEY_VIRTUAL_KEY || '',
  config: process.env.PORTKEY_CONFIG_ID || '' // References your semantic cache config
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request payload: "messages" array is required.' },
        { status: 400 }
      );
    }

    // 1. Extract the System Prompt (defines NovaRetail guardrails and assistant context)
    const systemMessage = messages.find((m: { role: string }) => m.role === 'system');

    // 2. Extract ONLY the latest user message to prevent historical token inflation
    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found in the conversation payload.' },
        { status: 400 }
      );
    }

    // 3. Reconstruct lightweight, deterministic payload for Prisma AIRS edge processing
    const cleanMessages = [
      ...(systemMessage ? [systemMessage] : []),
      lastUserMessage
    ];

    // 4. Dispatch request through Prisma AIRS AI Gateway to Azure OpenAI
    const response = await portkey.chat.completions.create({
      model: 'azure-gpt4mini-demo',
      messages: cleanMessages
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Prisma AIRS Gateway Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}