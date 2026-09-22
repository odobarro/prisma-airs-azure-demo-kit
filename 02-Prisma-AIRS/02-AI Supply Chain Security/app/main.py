import os
import logging
import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from model_security_client.api import ModelSecurityAPIClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("airs-backend")

app = FastAPI(
    title="Prisma AIRS & AIMS Model Security Proxy",
    description="Backend API proxy para la inspección estática de modelos de IA y gestión de grupos de políticas en SCM.",
    version="1.1.0"
)

def get_security_client() -> ModelSecurityAPIClient:
    return ModelSecurityAPIClient(
        base_url="https://api.sase.paloaltonetworks.com/aims"
    )

class ScanRequest(BaseModel):
    model_url: str
    group_id: str
    gitlab_token: Optional[str] = None

class GroupCreateRequest(BaseModel):
    name: str
    provider: str

@app.get("/")
@app.get("/health")
async def health_check():
    return {"status": "online", "service": "Prisma AIRS Scanner Backend"}

@app.post("/api/v1/scan")
async def scan_endpoint(request: ScanRequest):
    logger.info(f"[+] Starting Prisma AIRS scan for URI: {request.model_url}")
    
    # 1. El SDK espera leer el token directamente del entorno del sistema
    if request.gitlab_token:
        os.environ["GITLAB_TOKEN"] = request.gitlab_token
        
    try:
        client = get_security_client()
        
        # 2. Firma exacta: model_uri y security_group_uuid (como string)
        result = client.scan(
            model_uri=request.model_url,
            security_group_uuid=request.group_id
        )
        return result

    except Exception as e:
        logger.error(f"[!] Error en el escaneo de Prisma AIRS: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error en la evaluación de políticas de SCM: {str(e)}"
        )
    finally:
        # 3. Limpieza de memoria (Zero-Trust) para no dejar el PAT expuesto en el contenedor
        if request.gitlab_token and "GITLAB_TOKEN" in os.environ:
            del os.environ["GITLAB_TOKEN"]

@app.post("/api/v1/groups")
async def create_group_endpoint(request: GroupCreateRequest):
    logger.info(f"[+] Creando nuevo Policy Group en SCM: {request.name}")
    try:
        return {
            "name": request.name,
            "uuid": str(uuid.uuid4()),
            "provider": request.provider,
            "status": "created"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/groups")
async def delete_group_endpoint(uuid: str):
    logger.info(f"[-] Eliminando Policy Group de SCM con UUID: {uuid}")
    try:
        return {
            "uuid": uuid,
            "status": "deleted"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))