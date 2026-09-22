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
    group_id: str
    gitlab_token: Optional[str] = None

@app.post("/api/v1/scan", status_code=status.HTTP_200_OK)
async def scan_endpoint(
    payload: ScanRequest,
    x_api_key: Optional[str] = Header(None)
):
    if INTERNAL_API_TOKEN and x_api_key != INTERNAL_API_TOKEN:
        logger.warning("[-] Unauthorized access attempt.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Invalid x-api-key header."
        )

    try:
        logger.info(f"[+] Starting Prisma AIRS scan for URI: {payload.model_url}")
        
        # Dynamic Token Injection for Private Registries (GitLab)
        if payload.gitlab_token:
            os.environ["GITLAB_TOKEN"] = payload.gitlab_token
            logger.info("[*] GitLab PAT injected into environment for AIMS SDK.")

        # Initialize the official SDK
        client = ModelSecurityAPIClient(
            base_url="https://api.sase.paloaltonetworks.com/aims"
        )

        result = client.scan(
            security_group_uuid=payload.group_id,
            model_uri=str(payload.model_url)
        )
        
        logger.info(f"[+] Scan completed. Outcome: {getattr(result, 'eval_outcome', 'SUCCESS')}")

        if hasattr(result, "model_dump"):
            data = result.model_dump()
        elif hasattr(result, "dict"):
            data = result.dict()
        elif isinstance(result, dict):
            data = result
        else:
            data = getattr(result, "__dict__", {"status": "success"})

        if "violations" not in data:
            data["violations"] = []

        # Security cleanup: Remove token from environment after scan
        if payload.gitlab_token and "GITLAB_TOKEN" in os.environ:
            del os.environ["GITLAB_TOKEN"]

        return data

    except Exception as e:
        logger.error(f"[!] Error executing Prisma AIRS evaluation: {str(e)}", exc_info=True)
        if payload.gitlab_token and "GITLAB_TOKEN" in os.environ:
            del os.environ["GITLAB_TOKEN"]
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prisma AIRS evaluation failed: {str(e)}"
        )