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

    // Reenvío directo al backend de Prisma AIRS en Azure Container Apps
    const response = await fetch(azureEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ model_url, group_id }),
    });

    const realData = await response.json();

    // Retorna la respuesta real tal cual la entrega el backend (sin modificar una sola coma)
    return NextResponse.json(realData, { status: response.status });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error de comunicación con el backend de Prisma AIRS' },
      { status: 500 }
    );
  }
}