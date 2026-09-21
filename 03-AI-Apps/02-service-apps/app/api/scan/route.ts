import { NextResponse } from 'next/server';

// Simulador de latencia del motor Idira
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // 1. LLAMADA REAL A AZURE (Despierta el Scale-to-Zero, genera telemetría FinOps)
    if (azureEndpoint) {
       try {
          await fetch(azureEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            body: JSON.stringify({ model_url, group_id }),
          });
       } catch (e) {
          console.warn("Llamada en background a Azure fallida, continuando flujo híbrido.");
       }
    }

    // 2. Esperamos asíncronamente (simulando los ciclos de análisis de Prisma AIRS)
    await delay(6000); // 6 segundos de demo

    // 3. Payload Estructurado: Replicamos el JSON nativo de Prisma AIRS (visto en tu Python)
    const isPhi3 = model_url.toLowerCase().includes('phi-3');
    
    // Generamos el dictamen basado en el payload real de SCM
    const scmVerdict = {
      is_secure: !isPhi3, // Si es Phi-3, lo marcamos como riesgo para la demo
      summary: {
        passed: isPhi3 ? 12 : 14,
        failed: isPhi3 ? 2 : 0,
        total: 14
      },
      violations: isPhi3 ? [
        {
          rule_name: "License Compliance (SCM)",
          description: "Licencia restrictiva detectada (cc-by-nc-4.0). Viola la política corporativa de uso comercial.",
          file: "config.json"
        },
        {
          rule_name: "Vulnerability Threat (Idira Engine)",
          threat_description: "CVE-2024-3456: Riesgo crítico de ejecución de código arbitrario en la deserialización de tensores PyTorch.",
          file: "pytorch_model.bin"
        }
      ] : []
    };

    return NextResponse.json(scmVerdict, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error en proxy Zero-Trust' },
      { status: 500 }
    );
  }
}