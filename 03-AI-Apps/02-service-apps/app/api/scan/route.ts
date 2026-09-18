import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model_url, group_id } = body;

    if (!model_url || !group_id) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios: model_url o group_id' },
        { status: 400 }
      );
    }

    const azureEndpoint = process.env.NEXT_PUBLIC_SCANNER_API_URL || '';
    const apiKey = process.env.SCANNER_INTERNAL_API_KEY || '';

    if (!azureEndpoint) {
      return NextResponse.json(
        { error: 'La variable NEXT_PUBLIC_SCANNER_API_URL no está configurada en Vercel.' },
        { status: 500 }
      );
    }

    const response = await fetch(azureEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ model_url, group_id }),
    });

    const responseText = await response.text();

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json(
        {
          error: `El backend en Azure Container Apps devolvió un error HTTP ${response.status}.`,
          details: responseText.substring(0, 300),
        },
        { status: response.status || 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error interno en el proxy de Prisma AIRS' },
      { status: 500 }
    );
  }
}