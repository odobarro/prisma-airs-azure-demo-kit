import os
import logging
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, HttpUrl

# Importación del SDK oficial de Palo Alto Networks Prisma AIRS / AIMS
from model_security_client.api import ModelSecurityAPIClient

app = FastAPI(title="Prisma AIRS Model Security Scanner")
logger = logging.getLogger("uvicorn.error")

# Secreto interno para validar las peticiones procedentes del Proxy en Vercel
INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")

class ScanRequest(BaseModel):
    model_url: HttpUrl
    group_id: Optional[str] = "2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32"

@app.post("/api/v1/scan", status_code=status.HTTP_200_OK)
async def scan_endpoint(
    payload: ScanRequest,
    x_api_key: Optional[str] = Header(None)
):
    """
    Endpoint SÍNCRONO de Prisma AIRS.
    Ejecuta el análisis contra la API de AIMS y retorna el resultado
    físico completo a Vercel en la misma llamada HTTP.
    """
    # 1. Validación de seguridad Zero-Trust
    if INTERNAL_API_TOKEN and x_api_key != INTERNAL_API_TOKEN:
        logger.warning("[-] Intento de acceso denegado: Token inválido.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Cabecera x-api-key no válida."
        )

    try:
        logger.info(f"[+] Iniciando escaneo síncrono Prisma AIRS para URI: {payload.model_url}")
        
        # El SDK lee automáticamente MODEL_SECURITY_CLIENT_ID, SECRET y TSG_ID de las Env Vars de Azure
        client = ModelSecurityAPIClient(
            base_url="https://api.sase.paloaltonetworks.com/aims"
        )

        # 2. Ejecución síncrona en el motor de SCM / AIMS
        result = client.scan(
            security_group_uuid=payload.group_id,
            model_uri=str(payload.model_url)
        )
        
        logger.info(f"[+] Escaneo completado. Outcome: {getattr(result, 'eval_outcome', 'SUCCESS')}")

        # 3. Conversión del objeto de respuesta del SDK a un formato JSON serializable para FastAPI
        if hasattr(result, "model_dump"):
            return result.model_dump()
        elif hasattr(result, "dict"):
            return result.dict()
        elif isinstance(result, dict):
            return result
        else:
            return getattr(result, "__dict__", {"status": "success", "raw_result": str(result)})

    except Exception as e:
        logger.error(f"[!] Error ejecutando análisis en Prisma AIRS: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo durante la evaluación en Prisma AIRS: {str(e)}"
        )