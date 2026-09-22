import os
import logging
import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Importaciones oficiales del SDK de Palo Alto Networks (Prisma AIRS)
from model_security_client.api import ModelSecurityAPIClient
from model_security_client.generated.mgmt.models.ModelSecurityGroupCreateRequestSchema import ModelSecurityGroupCreateRequestSchema

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

# --- Modelos de Pydantic (Frontend -> Backend) ---

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
    return {"status": "online", "service": "Prisma AIRS Scanner Backend"}

@app.post("/api/v1/scan")
async def scan_endpoint(request: ScanRequest):
    logger.info(f"[+] Starting Prisma AIRS scan for URI: {request.model_url}")
    
    if request.gitlab_token:
        os.environ["GITLAB_TOKEN"] = request.gitlab_token
        
    try:
        client = get_security_client()
        result = client.scan(
            model_uri=request.model_url,
            security_group_uuid=request.group_id
        )
        return result
    except Exception as e:
        logger.error(f"[!] Error en el escaneo de Prisma AIRS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en SCM: {str(e)}")
    finally:
        if request.gitlab_token and "GITLAB_TOKEN" in os.environ:
            del os.environ["GITLAB_TOKEN"]

@app.post("/api/v1/groups")
async def create_group_endpoint(request: GroupCreateRequest):
    logger.info(f"[+] Creando nuevo Policy Group en SCM: {request.name} ({request.provider})")
    try:
        client = get_security_client()
        
        # Mapeo del proveedor (Hugging Face / GitLab) al formato esperado por SCM
        # Usamos S3 como fallback de seguridad basado en tu script
        source_type_mapped = request.provider.upper() if request.provider else "S3"
        
        # Instanciamos el Schema estricto exigido por el SDK de Palo Alto
        schema = ModelSecurityGroupCreateRequestSchema(
            name=request.name,
            source_type=source_type_mapped,
            description=f"Security group for {request.provider} models created via AIRS Portal",
            rule_configurations={}
        )
        
        # Inyección a la API de SCM
        group = client.create_security_group(data=schema)
        
        return {
            "name": request.name,
            "uuid": str(group.uuid),
            "provider": request.provider,
            "status": "created"
        }
    except Exception as e:
        logger.error(f"[!] Error al crear el Policy Group en SCM: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/groups")
async def delete_group_endpoint(uuid: str):
    logger.info(f"[-] Eliminando Policy Group de SCM con UUID: {uuid}")
    try:
        client = get_security_client()
        # La API de administración suele requerir el UUID en la ruta o como arg directo
        client.delete_security_group(uuid)
        return {
            "uuid": uuid,
            "status": "deleted"
        }
    except Exception as e:
        logger.error(f"[!] Error al eliminar el Policy Group en SCM: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))