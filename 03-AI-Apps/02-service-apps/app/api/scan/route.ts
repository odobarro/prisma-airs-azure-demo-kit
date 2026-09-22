import { NextResponse } from 'next/server';

// El nombre de la cuenta es un dato público/identificador, puede ir en el código.
const AZURE_ACCOUNT_NAME = "odstgairsdemo001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model_url, group_id, gitlab_token, azure_token } = body;

    if (!model_url || !group_id) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    // Variables de entorno de Vercel
    const azureEndpoint = process.env.NEXT_PUBLIC_SCANNER_API_URL || '';
    const apiKey = process.env.SCANNER_INTERNAL_API_KEY || '';
    const realAzureKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || ''; // <-- ¡Secreto seguro!

    const payload: any = { model_url, group_id };
    
    if (gitlab_token) {
        payload.gitlab_token = gitlab_token;
    }

    // INTERCEPCIÓN ZERO-TRUST PARA AZURE
    if (azure_token) {
        if (azure_token === '***AZURE_SECURE_PRESET***') {
            if (!realAzureKey) {
                 return NextResponse.json({ error: 'Falta la clave de Azure en las variables de entorno de Vercel (AZURE_STORAGE_ACCOUNT_KEY)' }, { status: 500 });
            }
            // Construimos la cadena dinámicamente sin exponer el secreto
            payload.azure_token = `DefaultEndpointsProtocol=https;AccountName=${AZURE_ACCOUNT_NAME};AccountKey=${realAzureKey};EndpointSuffix=core.windows.net`;
        } else {
            // Permite al usuario usar una clave distinta manualmente si lo desea
            payload.azure_token = `DefaultEndpointsProtocol=https;AccountName=${AZURE_ACCOUNT_NAME};AccountKey=${azure_token};EndpointSuffix=core.windows.net`;
        }
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}