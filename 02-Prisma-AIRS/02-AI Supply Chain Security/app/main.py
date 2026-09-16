import os
import logging
from typing import Optional
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException, status
from pydantic import BaseModel, HttpUrl

from model_security_client.api import ModelSecurityAPIClient

app = FastAPI(title="Prisma AIRS Model Security Scanner")
logger = logging.getLogger("uvicorn.error")

INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")

class ScanRequest(BaseModel):
    model_url: HttpUrl
    group_id: Optional[str] = "2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32"

def execute_prisma_airs_scan(model_uri: str, security_group_uuid: str):
    try:
        logger.info(f"[+] Iniciando Prisma AIRS scan para URI: {model_uri}")
        
        client = ModelSecurityAPIClient(
            base_url="https://api.sase.paloaltonetworks.com/aims",
            client_id=os.getenv("PALO_ALTO_CLIENT_ID"),
            client_secret=os.getenv("PALO_ALTO_CLIENT_SECRET"),
            tsg_id=os.getenv("PALO_ALTO_TSG_ID")
        )

        result = client.scan(
            security_group_uuid=security_group_uuid,
            model_uri=model_uri
        )

        logger.info(f"[+] Scan completado. Resultado: {getattr(result, 'eval_outcome', 'SUCCESS')}")

    except Exception as e:
        logger.error(f"[!] Error ejecutando AIRS: {str(e)}", exc_info=True)

@app.post("/api/v1/scan", status_code=status.HTTP_202_ACCEPTED)
async def scan_endpoint(
    payload: ScanRequest,
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None)
):
    background_tasks.add_task(execute_prisma_airs_scan, str(payload.model_url), payload.group_id)
    return {"status": "accepted", "message": "Scan queued"}