import os
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
        
        # Convert SDK result object to dictionary
        if hasattr(result, "model_dump"):
            data = result.model_dump()
        elif hasattr(result, "dict"):
            data = result.dict()
        else:
            data = getattr(result, "__dict__", {})

        scan_uuid = data.get("uuid")
        violations = []

        # 2. Query detailed violations from SCM if scan UUID exists
        if scan_uuid:
            try:
                if hasattr(client, "get_violations"):
                    viol_res = client.get_violations(scan_uuid)
                elif hasattr(client, "get_scan_violations"):
                    viol_res = client.get_scan_violations(scan_uuid)
                else:
                    # Fallback REST call using standard library urllib (zero external dependencies)
                    violations_url = f"https://api.sase.paloaltonetworks.com/aims/v1/scans/{scan_uuid}/violations"
                    req = urllib.request.Request(violations_url)
                    
                    auth_hdr = getattr(client, "auth_header", None)
                    if auth_hdr:
                        req.add_header("Authorization", auth_hdr)
                        
                    with urllib.request.urlopen(req) as resp:
                        if resp.status == 200:
                            viol_res = json.loads(resp.read().decode("utf-8"))
                        else:
                            viol_res = {}

                if isinstance(viol_res, dict):
                    violations = viol_res.get("violations", [])
                elif isinstance(viol_res, list):
                    violations = viol_res

            except Exception as viol_err:
                logger.warning(f"[!] Could not fetch detailed violations for scan {scan_uuid}: {str(viol_err)}")

        # 3. Enrich payload with SCM violations array
        data["violations"] = violations
        logger.info(f"[+] Scan completed. Outcome: {data.get('eval_outcome')}. Total violations: {len(violations)}")
        
        return data

    except Exception as e:
        logger.error(f"[!] Error executing Prisma AIRS evaluation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prisma AIRS evaluation failed: {str(e)}"
        )