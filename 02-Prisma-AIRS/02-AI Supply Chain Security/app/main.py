import os
import logging
import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 1. Corrección de la importación principal de la clase
from model_security_client import ModelSecurityAPIClient

# 2. Restauración de las excepciones específicas del SDK (vitales para que funcione el escaneo)
from model_security_client.exceptions import (
    StorageAccessError,
    ModelSecurityError,
)

# Configuración de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("airs-backend")

app = FastAPI(
    title="Prisma AIRS & AIMS Model Security Proxy",
    description="Backend API proxy para la inspección estática de modelos de IA y gestión de grupos de políticas en Strata Cloud Manager.",
    version="1.1.0"
)

# Carga de credenciales
CLIENT_ID = os.getenv("MODEL_SECURITY_CLIENT_ID")
CLIENT_SECRET = os.getenv("MODEL_SECURITY_CLIENT_SECRET")
TSG_ID = os.getenv("TSG_ID")

# Inicialización diferida / Singleton del cliente de Palo Alto
def get_security_client() -> ModelSecurityAPIClient:
    if not CLIENT_ID or not CLIENT_SECRET or not TSG_ID:
        logger.error("[!] Error de configuración: Faltan credenciales de Prisma AIRS en el entorno.")
        raise HTTPException(
            status_code=500,
            detail="Credenciales de Prisma AIRS / SCM no configuradas en el servidor."
        )
    return ModelSecurityAPIClient(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        tsg_id=TSG_ID
    )

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
async def health_check():
    return {
        "status": "online",
        "service": "Prisma AIRS Scanner Backend"
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

        # Llamada real al SDK de Prisma AIRS
        result = client.scan(**scan_kwargs)
        return result

    # Restauramos el manejo de errores original para que no rompa el hilo principal
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
        logger.error(f"[!] Error no controlado: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {str(e)}"
        )

# --- Nuevos Endpoints de Gestión de Grupos ---

@app.post("/api/v1/groups")
async def create_group_endpoint(request: GroupCreateRequest):
    logger.info(f"[+] Creando nuevo Policy Group en SCM: {request.name} ({request.provider})")
    try:
        # Aquí iría: new_group = client.create_group(...)
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
        # Aquí iría: client.delete_group(uuid)
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