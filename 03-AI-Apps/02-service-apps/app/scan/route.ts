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

    const response = await fetch(azureEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ model_url, group_id }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error interno en el proxy de Prisma AIRS' },
      { status: 500 }
    );
  }
}