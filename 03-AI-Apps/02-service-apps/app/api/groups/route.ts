import { NextResponse } from 'next/server';

// Asegúrate de que esta variable apunta a tu Azure Container App (ej: https://od-airs-scanner-api.kindpebble-....westeurope.azurecontainerapps.io)
const BACKEND_URL = process.env.AZURE_BACKEND_URL || "http://localhost:8000";

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/groups`, {
            cache: 'no-store' // Vital para que no cachee grupos antiguos
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${BACKEND_URL}/api/v1/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        // Obtenemos el UUID de los parámetros de la URL (?uuid=...)
        const { searchParams } = new URL(request.url);
        const uuid = searchParams.get('uuid');

        const response = await fetch(`${BACKEND_URL}/api/v1/groups?uuid=${uuid}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}