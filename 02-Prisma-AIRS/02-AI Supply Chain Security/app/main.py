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
        raise HTTPException(status_code=403, detail="Invalid token.")

    try:
        logger.info(f"[+] Starting Prisma AIRS scan: {payload.model_url}")
        client = ModelSecurityAPIClient(base_url="https://api.sase.paloaltonetworks.com/aims")
        
        result = client.scan(
            security_group_uuid=payload.group_id,
            model_uri=str(payload.model_url)
        )
        
        # Parse SDK response
        if hasattr(result, "model_dump"):
            data = result.model_dump()
        elif hasattr(result, "dict"):
            data = result.dict()
        else:
            data = getattr(result, "__dict__", {})

        scan_uuid = data.get("uuid")
        rules_failed = data.get("eval_summary", {}).get("rules_failed", 0)
        
        violations = []
        diagnostic = "OK"

        # Optimized Smart Polling (FinOps / Serverless Timeout friendly)
        if scan_uuid and rules_failed > 0:
            for attempt in range(3):
                try:
                    auth_token = None
                    if hasattr(client, "session") and hasattr(client.session, "headers"):
                        auth_token = client.session.headers.get("Authorization")
                    
                    if not auth_token and hasattr(client, "auth_header"):
                        auth_token = client.auth_header
                        
                    if not auth_token:
                        diagnostic = "NO_AUTH_TOKEN_SDK"
                        break

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
                                diagnostic = "SUCCESS"
                                break
                            else:
                                diagnostic = "EMPTY_ARRAY"
                except Exception as e:
                    diagnostic = f"ERR: {str(e)}"
                
                # Only sleep if we are going to retry, reducing total request time
                if attempt < 2:
                    time.sleep(1.0)

        # Fallback diagnostic injection if violations are still empty
        if len(violations) == 0:
            violations.append({
                "rule_name": "Diagnostic Trace",
                "threat": "DIAGNOSTIC",
                "description": f"Rules failed: {rules_failed}. Polling Status: {diagnostic}. Check Vercel timeout logs.",
                "file": "Azure ACA"
            })

        data["violations"] = violations
        return data

    except Exception as e:
        logger.error(f"[!] Critical Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))