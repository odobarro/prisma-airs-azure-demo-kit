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

        # 1. Execute primary model scan in AIMS
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

        # 2. Smart Polling for Eventual Consistency
        if scan_uuid and rules_failed > 0:
            max_retries = 3
            
            for attempt in range(max_retries):
                try:
                    # Give SCM backend time to propagate the violations to the database
                    time.sleep(1.5)
                    logger.info(f"[*] Fetching violations for {scan_uuid} (Attempt {attempt + 1}/{max_retries})")
                    
                    viol_res = {}
                    if hasattr(client, "get_violations"):
                        viol_res = client.get_violations(scan_uuid)
                    elif hasattr(client, "get_scan_violations"):
                        viol_res = client.get_scan_violations(scan_uuid)
                    else:
                        # Fallback REST call with dynamic auth header extraction from SDK
                        headers = {}
                        if hasattr(client, "session") and hasattr(client.session, "headers"):
                            headers = dict(client.session.headers)
                        elif hasattr(client, "_session") and hasattr(client._session, "headers"):
                            headers = dict(client._session.headers)
                        elif hasattr(client, "auth_header"):
                            headers["Authorization"] = client.auth_header

                        violations_url = f"https://api.sase.paloaltonetworks.com/aims/v1/scans/{scan_uuid}/violations"
                        req = urllib.request.Request(violations_url, headers=headers)
                        
                        with urllib.request.urlopen(req) as resp:
                            if resp.status == 200:
                                viol_res = json.loads(resp.read().decode("utf-8"))

                    # Parse response structure
                    if isinstance(viol_res, dict):
                        current_violations = viol_res.get("violations", [])
                    elif isinstance(viol_res, list):
                        current_violations = viol_res
                    else:
                        current_violations = []

                    # If SCM has propagated the data, break the polling loop
                    if len(current_violations) > 0:
                        violations = current_violations
                        break

                except Exception as viol_err:
                    logger.warning(f"[!] Attempt {attempt + 1} failed fetching violations: {str(viol_err)}")

        # 3. Enrich payload
        data["violations"] = violations
        logger.info(f"[+] Scan completed. Outcome: {data.get('eval_outcome')}. Fetched violations: {len(violations)}")
        
        return data

    except Exception as e:
        logger.error(f"[!] Error executing Prisma AIRS evaluation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prisma AIRS evaluation failed: {str(e)}"
        )