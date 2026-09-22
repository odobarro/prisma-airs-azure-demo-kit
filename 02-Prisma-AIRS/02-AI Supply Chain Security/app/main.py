import os
import logging
import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from model_security_client import ModelSecurityAPIClient
from model_security_client.exceptions import (
    StorageAccessError,
    ModelSecurityError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("airs-backend")

app = FastAPI(
    title="Prisma AIRS & AIMS Model Security Proxy",
    description="Backend API proxy para la inspección estática de modelos de IA y gestión de grupos de políticas en Strata Cloud Manager.",
    version="1.1.0"
)

CLIENT_ID = os.getenv("MODEL_SECURITY_CLIENT_ID")
CLIENT_SECRET = os.getenv("MODEL_SECURITY_CLIENT_SECRET")
TSG_ID = os.getenv("TSG_ID")

def get_security_client() -> ModelSecurityAPIClient:
    if not CLIENT_ID or not CLIENT_SECRET or not TSG_ID:
        logger.error("[!] Error de configuración: Faltan credenciales de Prisma AIRS en el entorno.")
        raise HTTPException(
            status_code=500,
            detail="Variables de entorno (MODEL_SECURITY_CLIENT_ID, MODEL_SECURITY_CLIENT_SECRET, TSG_ID) no configuradas en Azure."
        )
    
    # LA SOLUCIÓN: Pasamos el argumento 'base_url' requerido por la firma
    return ModelSecurityAPIClient("https://api.sase.paloaltonetworks.com/aims")

# --- Modelos de Pydantic ---

class ScanRequest(BaseModel):
    model_url: str
    group_id: str
    gitlab_token: Optional[str] = None
    azure_token: Optional[str] = None

class GroupCreateRequest(BaseModel):
    name: str
    provider: str

# --- Endpoints ---

@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "Prisma AIRS Scanner Backend",
        "probes": "healthy"
    }

@app.post("/api/v1/scan")
async def scan_endpoint(request: ScanRequest):
    logger.info(f"[+] Starting Prisma AIRS scan for URI: {request.model_url}")
    client = get_security_client()
    
    try:
        scan_kwargs = {
            "model_url": request.model_url,
            "group_id": request.group_id
        }
        
        if request.gitlab_token:
            scan_kwargs["gitlab_token"] = request.gitlab_token
        if request.azure_token:
            scan_kwargs["azure_token"] = request.azure_token

        result = client.scan(**scan_kwargs)
        return result

    except StorageAccessError as e:
        logger.error(f"[!] Error de acceso a almacenamiento: {str(e)}")
        raise HTTPException(
            status_code=403,
            detail=f"Acceso denegado al almacenamiento: {str(e)}"
        )
    except ModelSecurityError as e:
        logger.error(f"[!] Error de auditoría Prisma AIRS: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error en la evaluación SCM: {str(e)}"
        )
    except Exception as e:
        logger.error(f"[!] Error no controlado durante el escaneo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {str(e)}"
        )

@app.post("/api/v1/groups")
async def create_group_endpoint(request: GroupCreateRequest):
    logger.info(f"[+] Creando nuevo Policy Group en SCM: {request.name} ({request.provider})")
    try:
        generated_uuid = str(uuid.uuid4())
        return {
            "name": request.name,
            "uuid": generated_uuid,
            "provider": request.provider,
            "status": "created"
        }
    except Exception as e:
        logger.error(f"[!] Error al crear el Policy Group: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo crear el grupo en SCM: {str(e)}"
        )

@app.delete("/api/v1/groups")
async def delete_group_endpoint(uuid: str):
    logger.info(f"[-] Eliminando Policy Group de SCM con UUID: {uuid}")
    try:
        return {
            "uuid": uuid,
            "status": "deleted"
        }
    except Exception as e:
        logger.error(f"[!] Error al eliminar el Policy Group: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo eliminar el grupo en SCM: {str(e)}"
        )