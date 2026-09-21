import os
import time
import logging
import json
import urllib.request
import urllib.error
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, HttpUrl

from model_security_client.api import ModelSecurityAPIClient

app = FastAPI(title="Prisma AIRS Model Security Scanner")
logger = logging.getLogger("uvicorn.error")

INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")

class ScanRequest(BaseModel):
    model_url: HttpUrl
    group_id: Optional[str] = "2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32"

@app.post("/api/v1/scan", status_code=status.HTTP_200_OK)
async def scan_endpoint(
    payload: ScanRequest,
    x_api_key: Optional[str] = Header(None)
):
    if INTERNAL_API_TOKEN and x_api_key != INTERNAL_API_TOKEN:
        logger.warning("[-] Unauthorized access attempt: Invalid token.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Invalid x-api-key header."
        )

    try:
        logger.info(f"[+] Starting synchronous Prisma AIRS scan for URI: {payload.model_url}")
        
        client = ModelSecurityAPIClient(
            base_url="https://api.sase.paloaltonetworks.com/aims"
        )

        # 1. Ejecutar escaneo principal en AIMS
        result = client.scan(
            security_group_uuid=payload.group_id,
            model_uri=str(payload.model_url)
        )
        
        if hasattr(result, "model_dump"):
            data = result.model_dump()
        elif hasattr(result, "dict"):
            data = result.dict()
        else:
            data = getattr(result, "__dict__", {})

        scan_uuid = data.get("uuid")
        violations = []
        rules_failed = data.get("eval_summary", {}).get("rules_failed", 0)

        # 2. Consultar Violaciones Detalladas en AIMS Data API
        if scan_uuid and rules_failed > 0:
            max_retries = 3
            
            for attempt in range(max_retries):
                try:
                    time.sleep(2.0)
                    logger.info(f"[*] Fetching violations for {scan_uuid} via Data API (Attempt {attempt + 1}/{max_retries})")
                    
                    headers = {"Content-Type": "application/json"}
                    # Extraer el Bearer token del SDK oficial de Palo Alto
                    if hasattr(client, "session") and hasattr(client.session, "headers"):
                        sdk_headers = dict(client.session.headers)
                        if "Authorization" in sdk_headers:
                            headers["Authorization"] = sdk_headers["Authorization"]
                    elif hasattr(client, "auth_header"):
                        headers["Authorization"] = client.auth_header
                    
                    # Endpoint oficial extraído de la consola SCM
                    violations_url = f"https://api.sase.paloaltonetworks.com/aims/data/v1/scans/{scan_uuid}/rule-violations?skip=0&limit=100"
                    
                    req = urllib.request.Request(violations_url, headers=headers)
                    
                    viol_res = {}
                    with urllib.request.urlopen(req) as resp:
                        if resp.status == 200:
                            viol_res = json.loads(resp.read().decode("utf-8"))

                    if isinstance(viol_res, dict):
                        current_violations = viol_res.get("violations", [])
                    elif isinstance(viol_res, list):
                        current_violations = viol_res
                    else:
                        current_violations = []

                    if len(current_violations) > 0:
                        violations = current_violations
                        break

                except urllib.error.HTTPError as http_err:
                    logger.warning(f"[!] HTTP Error {http_err.code} fetching violations: {http_err.read().decode('utf-8')}")
                except Exception as viol_err:
                    logger.warning(f"[!] Attempt {attempt + 1} failed fetching violations: {str(viol_err)}")

        # 3. Enriquecer el payload JSON
        data["violations"] = violations
        logger.info(f"[+] Scan completed. Outcome: {data.get('eval_outcome')}. Fetched violations: {len(violations)}")
        
        return data

    except Exception as e:
        logger.error(f"[!] Error executing Prisma AIRS evaluation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prisma AIRS evaluation failed: {str(e)}"
        )