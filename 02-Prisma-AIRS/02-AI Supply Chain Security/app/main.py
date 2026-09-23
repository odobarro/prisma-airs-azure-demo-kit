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

# --- ENDPOINT DE GRUPOS ACTUALIZADO: EXTRACCIÓN DINÁMICA ---
@app.get("/api/v1/groups")
async def list_groups_endpoint():
    logger.info("[+] Recuperando lista de Policy Groups desde SCM...")
    try:
        client = get_security_client()
        
        # Aplicamos los parámetros exactos de la CLI y SDK
        try:
            groups_data = client.list_security_groups(limit=50, skip=0)
        except AttributeError:
            groups_data = client.get_security_groups(limit=50, skip=0)
            
        result = []
        items_to_process = []
        
        # Extracción a prueba de balas sin importar cómo anide el SDK los datos
        if isinstance(groups_data, list):
            items_to_process = groups_data
        elif hasattr(groups_data, "data") and isinstance(groups_data.data, list):
            items_to_process = groups_data.data
        elif hasattr(groups_data, "items") and isinstance(groups_data.items, list):
            items_to_process = groups_data.items
        else:
            # Si es un Pydantic Schema, volcamos a diccionario y buscamos la lista
            try:
                if hasattr(groups_data, "model_dump"):
                    obj_dict = groups_data.model_dump()
                elif hasattr(groups_data, "dict"):
                    obj_dict = groups_data.dict()
                else:
                    obj_dict = dict(groups_data)
                    
                # Buscamos la primera lista de objetos en el payload
                for val in obj_dict.values():
                    if isinstance(val, list):
                        items_to_process = val
                        break
            except Exception as parse_e:
                logger.warning(f"Error parseando el schema a diccionario: {parse_e}")
                
        # Iteramos sobre la lista de grupos extraída y mapeamos al frontend
        for g in items_to_process:
            if isinstance(g, dict):
                result.append({
                    "name": g.get("name", "Unknown"),
                    "uuid": str(g.get("uuid", "")),
                    "provider": g.get("source_type", "S3")
                })
            else:
                result.append({
                    "name": getattr(g, "name", "Unknown"),
                    "uuid": str(getattr(g, "uuid", "")),
                    "provider": getattr(g, "source_type", "S3")
                })
                
        return result
    except Exception as e:
        logger.error(f"[!] Error al listar los Policy Groups en SCM: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/groups")
async def create_group_endpoint(request: GroupCreateRequest):
    logger.info(f"[+] Creando nuevo Policy Group en SCM: {request.name}")
    try:
        client = get_security_client()
        
        provider_upper = request.provider.upper() if request.provider else ""
        if "HUGGING" in provider_upper:
            source_type_mapped = "HUGGING_FACE"
        elif "GITLAB" in provider_upper:
            source_type_mapped = "GITLAB"
        else:
            source_type_mapped = "S3"
            
        schema = ModelSecurityGroupCreateRequestSchema(
            name=request.name,
            source_type=source_type_mapped,
            description=f"Security group for {request.provider} models created via AIRS Portal",
            rule_configurations={}
        )
        
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
        client.delete_security_group(uuid)
        return {
            "uuid": uuid,
            "status": "deleted"
        }
    except Exception as e:
        logger.error(f"[!] Error al eliminar el Policy Group en SCM: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))