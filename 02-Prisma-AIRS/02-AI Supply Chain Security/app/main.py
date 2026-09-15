import os
import shutil
import subprocess
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException

app = FastAPI(
    title="Prisma AIRS Model Security API",
    description="Asynchronous backend orchestrator for Palo Alto Networks AI Model Security CLI",
    version="1.0.0"
)

# Shared internal token passed via Azure Container App environment variables
INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")

def execute_prisma_model_scan(model_url: str):
    """
    Background worker that clones the target AI model repo, runs the
    Prisma AIRS static scanner CLI, and sends findings to Strata Cloud Manager.
    """
    target_dir = "/tmp/scan_target"
    
    # Clean up previous workspace if needed
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)

    try:
        print(f"[+] Cloning target model repository from: {model_url}")
        clone_cmd = f"git clone --depth 1 {model_url} {target_dir}"
        clone_res = subprocess.run(clone_cmd, shell=True, capture_output=True, text=True)

        if clone_res.returncode != 0:
            print(f"[X] Git clone failed: {clone_res.stderr}")
            return

        print(f"[+] Launching Prisma AIRS Model Security scan...")
        # The CLI automatically reads PALO_ALTO_CLIENT_ID, PALO_ALTO_CLIENT_SECRET, and PALO_ALTO_TSG_ID
        scan_cmd = f"model-security scan --path {target_dir}"
        scan_res = subprocess.run(scan_cmd, shell=True, capture_output=True, text=True)

        print(f"[V] Scan complete. Output telemetry sent to Palo Alto SCM:\n{scan_res.stdout}")
        if scan_res.stderr:
            print(f"[!] Scan Warnings/Errors:\n{scan_res.stderr}")

    except Exception as exc:
        print(f"[X] Unhandled error during scan execution: {str(exc)}")
    finally:
        # Cleanup temporary downloaded model files
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)

@app.post("/api/v1/scan", status_code=202)
async def trigger_scan(
    payload: dict,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(None)
):
    """
    Endpoint triggered by Vercel Frontend or cURL.
    Validates X-API-Key and dispatches the scan asynchronously.
    """
    if not INTERNAL_API_TOKEN or x_api_key != INTERNAL_API_TOKEN:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized: Invalid or missing X-API-Key header"
        )

    model_url = payload.get("model_url")
    if not model_url:
        raise HTTPException(
            status_code=400, 
            detail="Missing required parameter: 'model_url'"
        )

    # Queue execution to background worker to return immediate 202 HTTP response
    background_tasks.add_task(execute_prisma_model_scan, model_url)

    return {
        "status": "accepted",
        "message": f"Scan queued successfully for {model_url}. Results will appear in Strata Cloud Manager.",
        "target": model_url
    }