import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model_url, group_id, gitlab_token } = body;

    if (!model_url || !group_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: model_url or group_id' },
        { status: 400 }
      );
    }

    const azureEndpoint = process.env.NEXT_PUBLIC_SCANNER_API_URL || '';
    const apiKey = process.env.SCANNER_INTERNAL_API_KEY || '';

    const payload: any = { model_url, group_id };
    if (gitlab_token) {
        payload.gitlab_token = gitlab_token;
    }

    const response = await fetch(azureEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const realData = await response.json();
    return NextResponse.json(realData, { status: response.status });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error communicating with Prisma AIRS backend' },
      { status: 500 }
    );
  }
}