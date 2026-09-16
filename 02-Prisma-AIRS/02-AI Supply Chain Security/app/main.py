import os
import logging
from typing import Optional
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException, status
from pydantic import BaseModel, HttpUrl

# Importación oficial según TechDocs de Palo Alto Networks
from model_security_client.api import ModelSecurityAPIClient

app = FastAPI(title="Prisma AIRS Model Security Scanner")
logger = logging.getLogger("uvicorn.error")

INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")

class ScanRequest(BaseModel):
    model_url: HttpUrl
    group_id: Optional[str] = "2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32"
    group_name: Optional[str] = "Default HUGGING_FACE"

def execute_prisma_airs_scan(model_uri: str, security_group_uuid: str):
    """
    Background worker executing native scan via Prisma AIRS Model Security SDK.
    """
    try:
        logger.info(f"[+] Initializing Prisma AIRS scan for URI: {model_uri}")
        logger.info(f"[+] Targeting Security Group UUID: {security_group_uuid}")

        # Inicialización del cliente AIMS
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

        logger.info(f"[+] Scan completed. Outcome: {getattr(result, 'eval_outcome', 'SUCCESS')}")
        logger.info(f"[+] Scanned Model Version UUID: {getattr(result, 'model_version_uuid', 'N/A')}")

    except Exception as e:
        logger.error(f"[!] Error during Prisma AIRS scan execution: {str(e)}", exc_info=True)

@app.post("/api/v1/scan", status_code=status.HTTP_202_ACCEPTED)
async def scan_endpoint(
    payload: ScanRequest,
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None)
):
    if INTERNAL_API_TOKEN and x_api_key != INTERNAL_API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API authentication token"
        )

    target_url = str(payload.model_url)
    group_uuid = payload.group_id or "2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32"

    background_tasks.add_task(execute_prisma_airs_scan, target_url, group_uuid)

    return {
        "status": "accepted",
        "message": f"Scan queued successfully for {target_url}. Results will appear in SCM.",
        "target": target_url
    }