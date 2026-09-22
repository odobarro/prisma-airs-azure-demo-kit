import { NextResponse } from 'next/server';

function getBackendUrl(endpointPath: string): string {
  const envUrl = process.env.NEXT_PUBLIC_SCANNER_API_URL || 'https://od-airs-scanner-api.azurecontainerapps.io/api/v1/scan';
  const baseUrl = envUrl.replace(/\/scan\/?$/, '').replace(/\/+$/, '');
  return baseUrl.endsWith('/api/v1') ? `${baseUrl}${endpointPath}` : `${baseUrl}/api/v1${endpointPath}`;
}

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

    const groupsUrl = getBackendUrl('/groups');
    const apiKey = process.env.SCANNER_INTERNAL_API_KEY || '';

    const response = await fetch(groupsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ name, provider }),
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: `Error del servidor de Azure (${response.status}): ${rawText || response.statusText}` },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });

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

    const groupsUrl = `${getBackendUrl('/groups')}?uuid=${encodeURIComponent(uuid)}`;
    const apiKey = process.env.SCANNER_INTERNAL_API_KEY || '';

    const response = await fetch(groupsUrl, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
      },
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: `Error del servidor de Azure (${response.status}): ${rawText || response.statusText}` },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}