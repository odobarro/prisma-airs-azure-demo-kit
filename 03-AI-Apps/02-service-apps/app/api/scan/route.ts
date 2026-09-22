import { NextResponse } from 'next/server';

function getBackendUrl(endpointPath: string): string {
  const envUrl = process.env.NEXT_PUBLIC_SCANNER_API_URL || 'https://od-airs-scanner-api.azurecontainerapps.io/api/v1/scan';
  const baseUrl = envUrl.replace(/\/scan\/?$/, '').replace(/\/+$/, '');
  return baseUrl.endsWith('/api/v1') ? `${baseUrl}${endpointPath}` : `${baseUrl}/api/v1${endpointPath}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model_url, group_id, gitlab_token } = body;

    if (!model_url || !group_id) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios (model_url, group_id)' },
        { status: 400 }
      );
    }

    const scanUrl = getBackendUrl('/scan');
    const apiKey = process.env.SCANNER_INTERNAL_API_KEY || '';

    const payload: Record<string, any> = { model_url, group_id };
    if (gitlab_token) {
      payload.gitlab_token = gitlab_token;
    }

    const response = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
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