import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, provider } = body;

    if (!name || !provider) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios (name, provider)' },
        { status: 400 }
      );
    }

    const scannerUrl = process.env.NEXT_PUBLIC_SCANNER_API_URL || '';
    const apiKey = process.env.SCANNER_INTERNAL_API_KEY || '';

    // Deriva la ruta de grupos reemplazando /scan por /groups
    const groupsEndpoint = scannerUrl.replace(/\/scan$/, '/groups');

    const response = await fetch(groupsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ name, provider }),
    });

    const realData = await response.json();
    return NextResponse.json(realData, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { error: 'UUID de grupo no proporcionado' },
        { status: 400 }
      );
    }

    const scannerUrl = process.env.NEXT_PUBLIC_SCANNER_API_URL || '';
    const apiKey = process.env.SCANNER_INTERNAL_API_KEY || '';

    const groupsEndpoint = `${scannerUrl.replace(/\/scan$/, '/groups')}?uuid=${encodeURIComponent(uuid)}`;

    const response = await fetch(groupsEndpoint, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
      },
    });

    const realData = await response.json();
    return NextResponse.json(realData, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}