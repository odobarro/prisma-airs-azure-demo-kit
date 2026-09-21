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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Invalid x-api-key header."
        )

    try:
        logger.info(f"[+] Starting synchronous Prisma AIRS scan for URI: {payload.model_url}")
        
        client = ModelSecurityAPIClient(
            base_url="https://api.sase.paloaltonetworks.com/aims"
        )

        # 1. Ejecución del escaneo en el motor de SCM
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

        # 2. Smart Polling con Observabilidad
        if scan_uuid and rules_failed > 0:
            max_retries = 4 # Incrementado para dar margen a SCM
            diagnostic_error = None
            
            for attempt in range(max_retries):
                try:
                    time.sleep(4.0) # 4 segundos de backoff por intento
                    logger.info(f"[*] Fetching violations for {scan_uuid} (Attempt {attempt + 1}/{max_retries})")
                    
                    headers = {"Content-Type": "application/json"}
                    
                    # Extracción agresiva del token de autorización
                    if hasattr(client, "session") and hasattr(client.session, "headers"):
                        sdk_headers = dict(client.session.headers)
                        if "Authorization" in sdk_headers:
                            headers["Authorization"] = sdk_headers["Authorization"]
                    
                    if "Authorization" not in headers and hasattr(client, "auth_header"):
                        headers["Authorization"] = client.auth_header
                        
                    if "Authorization" not in headers:
                        diagnostic_error = "MISSING_BEARER_TOKEN_IN_SDK"
                        break

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
                        diagnostic_error = None
                        break
                    else:
                        diagnostic_error = "EMPTY_ARRAY_FROM_SCM_DATABASE"

                except urllib.error.HTTPError as http_err:
                    error_body = http_err.read().decode('utf-8')
                    diagnostic_error = f"HTTP {http_err.code}: {error_body}"
                    logger.error(f"[!] {diagnostic_error}")
                    # No hacemos break en 500s por si es transitorio, pero sí en 401/403
                    if http_err.code in (401, 403):
                        break
                except Exception as viol_err:
                    diagnostic_error = f"INTERNAL_ERROR: {str(viol_err)}"
                    logger.error(f"[!] {diagnostic_error}")

            # Si el bucle termina sin violaciones pero SCM reportó fallos, inyectamos el diagnóstico
            if len(violations) == 0 and diagnostic_error:
                violations.append({
                    "rule_name": "Diagnostic System Warning",
                    "threat": "INTEGRATION_ERROR",
                    "description": f"Failed to retrieve detailed violations from SCM Data API. Reason: {diagnostic_error}",
                    "file": "Azure Container Apps Backend"
                })

        data["violations"] = violations
        logger.info(f"[+] Scan completed. Fetched violations: {len(violations)}")
        
        return data

    except Exception as e:
        logger.error(f"[!] Error executing Prisma AIRS evaluation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prisma AIRS evaluation failed: {str(e)}"
        )