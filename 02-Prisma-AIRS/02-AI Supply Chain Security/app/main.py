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
        rules_failed = data.get("eval_summary", {}).get("rules_failed", 0)
        
        violations = []
        diagnostic_info = "OK"

        if scan_uuid and rules_failed > 0:
            for attempt in range(3):
                time.sleep(2.5)
                try:
                    if hasattr(client, "get_scan_violations"):
                        violations = client.get_scan_violations(scan_uuid)
                        if violations: break
                    
                    auth_token = None
                    if hasattr(client, "session") and hasattr(client.session, "headers"):
                        auth_token = client.session.headers.get("Authorization")
                    elif hasattr(client, "auth_header"):
                        auth_token = client.auth_header
                    elif hasattr(client, "get_auth_header"):
                        auth_token = client.get_auth_header()
                        
                    if not auth_token:
                        diagnostic_info = "AUTH_TOKEN_NOT_EXPOSED_BY_SDK"
                        continue

                    url = f"https://api.sase.paloaltonetworks.com/aims/data/v1/scans/{scan_uuid}/rule-violations?skip=0&limit=100"
                    req = urllib.request.Request(url, headers={"Authorization": auth_token, "Content-Type": "application/json"})
                    
                    with urllib.request.urlopen(req) as resp:
                        if resp.status == 200:
                            viol_res = json.loads(resp.read().decode("utf-8"))
                            
                            if isinstance(viol_res, dict) and "violations" in viol_res:
                                violations = viol_res["violations"]
                            elif isinstance(viol_res, list):
                                violations = viol_res
                                
                            if len(violations) > 0:
                                break
                            else:
                                diagnostic_info = "SCM_RETURNED_EMPTY_ARRAY"

                except Exception as e:
                    diagnostic_info = f"POLLING_ERROR: {str(e)}"
                    logger.error(f"[!] {diagnostic_info}")

        if len(violations) == 0:
            violations.append({
                "rule_name": "Azure Revision Check",
                "threat": "DIAGNOSTIC",
                "description": f"New synchronous code IS running. Rules failed: {rules_failed}. Status: {diagnostic_info}",
                "file": "Azure Container Apps"
            })

        data["violations"] = violations
        return data

    except Exception as e:
        logger.error(f"[!] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))