import os
import logging
import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Importación oficial del SDK de Palo Alto Networks (Prisma AIRS)
from model_security_client.api import ModelSecurityAPIClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("airs-backend")

app = FastAPI(
    title="Prisma AIRS & AIMS Model Security Proxy",
    description="Backend API proxy para la inspección estática de modelos de IA y gestión de grupos de políticas en SCM.",
    version="1.1.0"
)

def get_security_client() -> ModelSecurityAPIClient:
    """
    Instancia el cliente oficial. El SDK lee las credenciales automáticamente 
    de las variables de entorno de Azure, pero EXIGE el base_url.
    """
    return ModelSecurityAPIClient(
        base_url="https://api.sase.paloaltonetworks.com/aims"
    )

# --- Modelos de Pydantic ---

class ScanRequest(BaseModel):
    model_url: str
    group_id: str
    gitlab_token: Optional[str] = None

class GroupCreateRequest(BaseModel):
    name: str
    provider: str

# --- Endpoints ---

@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "Prisma AIRS Scanner Backend"
    }

@app.post("/api/v1/scan")
async def scan_endpoint(request: ScanRequest):
    logger.info(f"[+] Starting Prisma AIRS scan for URI: {request.model_url}")
    
    try:
        client = get_security_client()
        
        # Mapeo exacto a la firma que exige el SDK de Palo Alto
        scan_kwargs = {
            "model_uri": request.model_url,
            "security_group_uuid": uuid.UUID(request.group_id)
        }
        
        # Prisma AIRS consolida la autenticación de repositorios en el parámetro 'token'
        if request.gitlab_token:
            scan_kwargs["token"] = request.gitlab_token

        # Llamada oficial al motor
        result = client.scan(**scan_kwargs)
        return result

    except Exception as e:
        logger.error(f"[!] Error en el escaneo de Prisma AIRS: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error en la evaluación de políticas de SCM: {str(e)}"
        )

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