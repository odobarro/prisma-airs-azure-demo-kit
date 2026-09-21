import os
import logging
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, HttpUrl

from model_security_client.api import ModelSecurityAPIClient

app = FastAPI(title="Prisma AIRS Model Security Scanner")
logger = logging.getLogger("uvicorn.error")

INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")

class ScanRequest(BaseModel):
    model_url: HttpUrl
    group_id: Optional[str] = "2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32"

@app.post("/api/v1/scan", status_code=status.HTTP_200_OK)
async def scan_endpoint(
    payload: ScanRequest,
    x_api_key: Optional[str] = Header(None)
):
    if INTERNAL_API_TOKEN and x_api_key != INTERNAL_API_TOKEN:
        logger.warning("[-] Unauthorized access attempt: Invalid token.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Invalid x-api-key header."
        )

    try:
        logger.info(f"[+] Starting synchronous Prisma AIRS scan for URI: {payload.model_url}")
        
        # Invocación directa y limpia del SDK oficial de Palo Alto Networks
        client = ModelSecurityAPIClient(
            base_url="https://api.sase.paloaltonetworks.com/aims"
        )

        result = client.scan(
            security_group_uuid=payload.group_id,
            model_uri=str(payload.model_url)
        )
        
        logger.info(f"[+] Scan completed. Outcome: {getattr(result, 'eval_outcome', 'SUCCESS')}")

        # Conversión segura del objeto de respuesta a JSON
        if hasattr(result, "model_dump"):
            data = result.model_dump()
        elif hasattr(result, "dict"):
            data = result.dict()
        elif isinstance(result, dict):
            data = result
        else:
            data = getattr(result, "__dict__", {"status": "success", "raw_result": str(result)})

        # Garantizamos que la clave violations exista para que el frontend no falle
        if "violations" not in data:
            data["violations"] = []

        return data

    except Exception as e:
        logger.error(f"[!] Error executing Prisma AIRS evaluation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prisma AIRS evaluation failed: {str(e)}"
        )