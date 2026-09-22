import { NextResponse } from 'next/server';

export const revalidate = 0; // Desactiva la caché en Vercel

const BACKEND_URL = process.env.AZURE_BACKEND_URL || "http://localhost:8000";

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/groups`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            },
            cache: 'no-store'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Backend Azure devolvió status ${response.status}: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
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
        const { searchParams } = new URL(request.url);
        const uuid = searchParams.get('uuid');

        const response = await fetch(`${BACKEND_URL}/api/v1/groups?uuid=${encodeURIComponent(uuid || '')}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}