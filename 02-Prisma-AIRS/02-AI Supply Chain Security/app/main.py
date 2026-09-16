import os
import logging
from typing import Optional
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException, status
from pydantic import BaseModel, HttpUrl
import importlib

app = FastAPI(title="Prisma AIRS Model Security Scanner")
logger = logging.getLogger("uvicorn.error")

INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")

class ScanRequest(BaseModel):
    model_url: HttpUrl
    group_id: Optional[str] = "2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32"
    group_name: Optional[str] = "Default HUGGING_FACE"

def execute_prisma_airs_scan(model_uri: str, security_group_uuid: str):
    """
    Background worker con importación dinámica (Keep-Alive pattern)
    """
    try:
        logger.info(f"[+] Iniciando escaneo para URI: {model_uri}")
        
        # Importación dinámica en tiempo de ejecución para evitar CrashLoopBackOff
        msc = importlib.import_module("model_security_client")
        logger.info(f"[DEBUG] Contenido del paquete raíz: {dir(msc)}")
        
        # Intentamos obtener el cliente genérico
        client_class = getattr(msc, "ModelSecurityAPIClient", None)
        if not client_class:
            # Si no está en la raíz, miramos si tiene el submódulo .api
            msc_api = importlib.import_module("model_security_client.api")
            logger.info(f"[DEBUG] Contenido del submódulo API: {dir(msc_api)}")
            client_class = getattr(msc_api, "ModelSecurityAPIClient", None)
            
        if not client_class:
            raise ImportError("No se pudo localizar la clase ModelSecurityAPIClient en el SDK.")

        # Inicialización del cliente
        client = client_class(
            base_url="https://api.sase.paloaltonetworks.com/aims",
            client_id=os.getenv("PALO_ALTO_CLIENT_ID"),
            client_secret=os.getenv("PALO_ALTO_CLIENT_SECRET"),
            tsg_id=os.getenv("PALO_ALTO_TSG_ID")
        )

        result = client.scan(security_group_uuid=security_group_uuid, model_uri=model_uri)
        logger.info(f"[+] Outcome: {getattr(result, 'eval_outcome', 'SUCCESS')}")

    except Exception as e:
        logger.error(f"[!] Error ejecutando AIRS: {str(e)}")

@app.post("/api/v1/scan", status_code=status.HTTP_202_ACCEPTED)
async def scan_endpoint(
    payload: ScanRequest,
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None)
):
    if INTERNAL_API_TOKEN and x_api_key != INTERNAL_API_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    background_tasks.add_task(execute_prisma_airs_scan, str(payload.model_url), payload.group_id)
    return {"status": "accepted", "message": "Scan queued"}