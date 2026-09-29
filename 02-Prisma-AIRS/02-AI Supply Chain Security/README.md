# Module 02: AI Supply Chain Security (Model Security in Prisma AIRS)

## What is AI Supply Chain Security?
AI innovation is transforming every industry, but beneath that progress lies a growing and often invisible attack surface: the AI supply chain. Foundation models, reusable skills, prompts, configurations, and supporting artifacts can introduce malicious code, hidden instructions, unsafe dependencies, or excessive privileges that traditional security tools are not designed to detect.

Prisma AIRS AI Supply Chain Security brings visibility, validation, and control to every AI artifact before it reaches production. By securing both AI models and agent skills through a unified platform, you can innovate confidently while protecting intellectual property, reducing operational risk, and maintaining regulatory trust.

* **Prevent threats before deployment** by identifying malicious code, unsafe execution paths, hidden instructions, and policy violations.
* **Accelerate AI adoption** by automating validation and reducing manual security reviews.
* **Preserve intellectual property** by scanning artifacts within your controlled environments.
* **Demonstrate governance and compliance** with audit-ready evidence and consistent policy enforcement.

### Core Capabilities
Prisma AIRS AI Supply Chain Security provides two core scanning capabilities covering the full range of AI artifacts:

* **AI Model Security** scans model files for malicious code and backdoors, unsafe serialization formats (e.g., pickle exploits), insecure dependencies, license violations, metadata anomalies, and architecture-based security risks.
* **AI Skill Security** scans agent skills for prompt manipulation and embedded instructions, arbitrary code execution, secret and credential access, unsafe shell commands, external network communication, data exfiltration risks, dangerous tool or Model Context Protocol (MCP) usage, and hidden dependencies or privilege escalation.

Prisma AIRS continuously tracks security posture across both capability areas through centralized dashboards, threat intelligence updates, audit logs, scan history, compliance reporting, and organization-wide policy visibility in Strata Cloud Manager (SCM).

---

## 📚 Resources & Official Documentation
For comprehensive technical details, implementation guides, and best practices, refer to the official Palo Alto Networks documentation:

* 🔗 [Prisma AIRS - AI Supply Chain Security Documentation](https://docs.paloaltonetworks.com/ai-runtime-security/ai-model-security/ai-supply-chain-security)
* 🔗 [Configure Identity and Access Management (IAM) for Model Security](https://docs.paloaltonetworks.com/ai-runtime-security/ai-model-security/ai-supply-chain-security/model-security-to-secure-your-ai-models/get-started-with-ai-model-security/configure-identity-and-access-management)

---

## Prerequisites

Ensure the following prerequisites are met prior to beginning deployment:

* **Azure Cloud Subscription:** Active Azure Subscription with privileges to deploy Azure Container Apps.
  * **Resource Provider Registration:** The target subscription must have `Microsoft.App` and `Microsoft.OperationalInsights` registered:
    ```bash
    az provider register --namespace Microsoft.App
    az provider register --namespace Microsoft.OperationalInsights
    ```
* **Local CLI & Build Tools:** Installed binaries for `az CLI`, `terraform` (>= 1.5.0), `docker`, `uv`, and `git`.
* **GitHub Account & Container Registry:** A GitHub user/org with a generated Personal Access Token (PAT) having `write:packages` and `read:packages` scopes.
* **Palo Alto Networks Tenant Access:** Active administrative access to Strata Cloud Manager (SCM) and Customer Support Portal (CSP).

---

## Step 1: Licensing and Activation (CSP & SCM Setup)

Prisma AIRS Model Security is metered using **Palo Alto Networks Flex Credits**. To provision your tenant:

1. Log in to the [Palo Alto Networks Customer Support Portal (CSP)](https://support.paloaltonetworks.com/).
2. Create a **Deployment Profile (DP)** and allocate your designated Flex Credits to Prisma AIRS.
3. Map the Deployment Profile to your **Tenant Service Group (TSG)**.  
   > ⚠️ **Important:** The Tenant Service Group (TSG) **MUST be located in a supported region**.
4. Log in to **Strata Cloud Manager (SCM)**, navigate to **Settings > Service Accounts**, and obtain your `Client ID` and `Client Secret`.
   * **Note:** You can reuse the Service Account previously created in [`02-Prisma-AIRS/01-AI-Gateway`](../01-AI-Gateway/README.md).
   * **Custom RBAC:** To enforce Least Privilege Access Control by creating a dedicated Service Account specifically for Model Security, refer to the IAM Configuration Guide linked above.

---

## 🏗️ Architecture & Authentication Handshake

This module deploys a serverless, API-driven orchestration layer wrapping the Prisma AIRS client (`model-security-client==1.1.0`).

```text
  ┌─────────────────────────┐
  │  GitHub Actions Runner  │
  └────────────┬────────────┘
               │ 1. OAuth Token Handshake ([https://auth.apps.paloaltonetworks.com/oauth2/access_token](https://auth.apps.paloaltonetworks.com/oauth2/access_token))
               │ 2. Query PyPI Index Endpoint ([https://api.sase.paloaltonetworks.com/aims/mgmt/v1/pypi/authenticate](https://api.sase.paloaltonetworks.com/aims/mgmt/v1/pypi/authenticate))
               ▼
  ┌─────────────────────────┐
  │ Private PyPI Index URL  │  (Temporary Bearer Token Auth)
  └────────────┬────────────┘
               │ 3. Build & Inject into Docker via build-arg (PYPI_URL)
               ▼
  ┌─────────────────────────┐     4. Push Image      ┌─────────────────────────┐
  │  Docker Image (uv)      ├───────────────────────►│ GitHub Container Reg.   │
  └─────────────────────────┘                        └────────────┬────────────┘
                                                                  │ 5. Pull Image
                                                                  ▼
  ┌─────────────────────────┐     6. Runtime Auth     ┌─────────────────────────┐
  │ Azure Container Apps    ├───────────────────────►│ Strata Cloud Manager    │
  │ (Scale-to-Zero API)     │   (secretref Injection)│ (Telemetry & Scan Logs) │
  └─────────────────────────┘                        └─────────────────────────┘
```

### Key Architectural Principles
1. **Two-Stage Authentication Handshake (`get_pypi_url.sh`)**: Executed automatically on the GitHub host runner during CI/CD. The runner authenticates against SCM via HTTP Basic Auth to fetch an OAuth token, then queries `/mgmt/v1/pypi/authenticate` to dynamically obtain the signed private PyPI repository URL.
2. **Host-Level Token Generation**: Resolving PyPI authentication on the GitHub Actions host runner eliminates Docker Buildx DNS isolation issues (`exit code 6`) and prevents embedding sensitive Client Secrets inside Docker layer histories (`SecretsUsedInArgOrEnv`).
3. **Hermetic Packaging with `uv`**: Uses `uv` on `python:3.12-slim` to accelerate installation of `model-security-client==1.1.0` without bloating image size.
4. **Runtime Secret Injection**: Azure Container Apps pulls build artifacts from GHCR and injects SCM secrets dynamically via Azure Native Secret references (`secretref`).

---

## 📋 Configuration & Secret Reference Matrix

### GitHub Actions Secrets (Build-Time Execution)

To configure these secrets, navigate to your GitHub repository: **Settings > Secrets and variables > Actions > New repository secret**.

| Secret Name | Source | Description |
| :--- | :--- | :--- |
| `MODEL_SECURITY_CLIENT_ID` | Palo Alto Networks SCM | Service Account Client ID for OAuth token generation. |
| `MODEL_SECURITY_CLIENT_SECRET` | Palo Alto Networks SCM | Service Account Client Secret for OAuth authentication. |
| `TSG_ID` | Palo Alto Networks CSP/SCM | Tenant Service Group Identifier. |

> ℹ️ **Note on `get_pypi_url.sh`:** You do **not** need to execute this script manually during setup. Simply ensure the file is committed to your repository with execution permissions (`chmod +x app/get_pypi_url.sh`). The GitHub Actions workflow automatically executes it on the runner host to fetch the short-lived PyPI URL during build time.

### Azure Container Apps Variables & Secrets (Runtime Execution)

| Parameter / Env Variable | Injection Type | Required Value / Format |
| :--- | :--- | :--- |
| `panw-client-id` | Azure Secret | SCM Service Account Client ID. |
| `panw-client-secret` | Azure Secret | SCM Service Account Client Secret. |
| `panw-tsg-id` | Azure Secret | Palo Alto Networks Tenant Service Group ID (`TSG_ID`). |
| `MODEL_SECURITY_CLIENT_ID` | Env Variable | Mapped via `secretref:panw-client-id`. |
| `MODEL_SECURITY_CLIENT_SECRET` | Env Variable | Mapped via `secretref:panw-client-secret`. |
| `TSG_ID` | Env Variable | Mapped via `secretref:panw-tsg-id`. |
| `MODEL_SECURITY_API_ENDPOINT` | Env Variable | `https://api.sase.paloaltonetworks.com/aims` (Default). |

---

## Step 2: Build and Push Container Image to GHCR

### Method A: Automated CI/CD via GitHub Actions (Recommended)

1. **Trigger the Workflow:** Commit and push your local repository changes to GitHub:
   ```bash
   git add .
   git commit -m "feat(airs): implement Prisma AIRS supply chain security scanner"
   git push origin main
   ```

2. **Workflow Execution:** The CI/CD pipeline (`.github/workflows/build-scanner.yml`):
   * Sanitizes shell script line endings (`sed -i 's/\r$//'`).
   * Runs `get_pypi_url.sh` automatically on the GitHub host runner using your GitHub Repository Secrets.
   * Compiles the container using `uv` and publishes `airs-model-scanner:latest` to GHCR.

3. **Verify Image in GHCR:**
   Ensure `ghcr.io/<YOUR_GITHUB_USERNAME>/airs-model-scanner:latest` is published under GitHub Packages.

### Method B: Manual CLI Build (Fallback)

```bash
export GHCR_USERNAME="<YOUR_GITHUB_USERNAME_OR_ORG>"
export GHCR_PAT="<YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>"

echo $GHCR_PAT | docker login ghcr.io -u $GHCR_USERNAME --password-stdin

cd "02-Prisma-AIRS/02-AI Supply Chain Security/app"
export PYPI_URL=$(./get_pypi_url.sh)
docker build --build-arg PYPI_URL="$PYPI_URL" -t ghcr.io/$GHCR_USERNAME/airs-model-scanner:latest .
docker push ghcr.io/$GHCR_USERNAME/airs-model-scanner:latest
```

---

## Step 3: Terraform Infrastructure Provisioning

Navigate to the `terraform/` directory to provision the Azure Container App backend.

### 1. Prerequisites: GitHub Personal Access Token (PAT)
Before filling in your Terraform variables, ensure you have generated a Personal Access Token (PAT) in GitHub:
1. Go to **GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)**.
2. Click **Generate new token (classic)** and select the **`read:packages`** and **`write:packages`** scopes.
3. Save the token (`ghp_...`); you will use it as the `ghcr_pat` variable.

### 2. Create the `terraform.tfvars` File
Copy the example file to create your local variables configuration:

```bash
cd ../terraform/
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` replacing all placeholders with your environment-specific credentials:

```hcl
# ==============================================================================
# GitHub Container Registry (GHCR) Settings
# ==============================================================================
ghcr_username = "<YOUR_GITHUB_USERNAME_OR_ORG>"
ghcr_pat      = "<YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>"

# ==============================================================================
# Container Naming Settings (Optional in tfvars; comment out to prompt)
# ==============================================================================
# Set a custom container name below, or comment out the line so Terraform prompts interactively
container_name = "<YOUR_CONTAINER_NAME>"

# ==============================================================================
# Palo Alto Networks Strata Cloud Manager (SCM) Credentials
# ==============================================================================
panw_mgmt_client_id     = "<YOUR_SERVICE_ACCOUNT_CLIENT_ID>"
panw_mgmt_client_secret = "<YOUR_SERVICE_ACCOUNT_CLIENT_SECRET>"
panw_mgmt_tsg_id        = "<YOUR_TENANT_SERVICE_GROUP_ID>"

# ==============================================================================
# Security & API Integration Keys
# ==============================================================================
internal_api_token = "<YOUR_SHARED_INTERNAL_API_SECRET_KEY>"
```

### 3. Variable Configuration Matrix

| Variable Name | Prompted Interactive? | Data Type | Description |
| :--- | :---: | :---: | :--- |
| `location` | **Yes** | `string` | Target Azure Region (e.g., `spaincentral`, `westeurope`). Must match `01-azure-openai-infrastructure`. |
| `prefix` | **Yes** | `string` | Global resource prefix (e.g., `airs`, `company-ai`). |
| `environment` | **Yes** | `string` | Deployment environment tier (`dev`, `stg`, `prd`). |
| `container_name` | **Prompted / Optional** | `string` | Name of the container instance inside ACA (defaults via prompt or `tfvars`). |
| `ghcr_username` | No (`tfvars`) | `string` | GitHub username or Organization hosting the image in GHCR. |
| `ghcr_pat` | No (`tfvars`) | `string` (Sensitive) | GitHub PAT with `read:packages` access scope. |
| `panw_mgmt_client_id` | No (`tfvars`) | `string` (Sensitive) | SCM Service Account Client ID. |
| `panw_mgmt_client_secret` | No (`tfvars`) | `string` (Sensitive) | SCM Service Account Client Secret. |
| `panw_mgmt_tsg_id` | No (`tfvars`) | `string` | Palo Alto Networks Tenant Service Group ID. |
| `internal_api_token` | No (`tfvars`) | `string` (Sensitive) | Shared authorization secret between Vercel and Azure. |

### 4. Apply Infrastructure
Run Terraform to deploy the backend environment:

```bash
terraform init
terraform apply
```

During execution, Terraform will prompt for `location`, `prefix`, and `environment` if omitted from `terraform.tfvars`. Upon success, the terminal will output the public URL:

```text
Outputs:

scanner_api_url = "[https://ca-airs-airs-scanner-api-prd.westeurope.azurecontainerapps.io/api/v1/scan](https://ca-airs-airs-scanner-api-prd.westeurope.azurecontainerapps.io/api/v1/scan)"
```

> **FinOps Note:** Setting `min_replicas = 0` ensures the container shuts down automatically during idle periods, significantly reducing compute consumption.

---

## Step 4: Runtime Deployment & End-to-End Verification

### 1. Configure Secrets in Azure Container Apps
```bash
az containerapp secret set \
  --name od-airs-scanner-api \
  --resource-group od-rg-prisma-airs-demo \
  --secrets \
    "panw-client-id=<YOUR_CLIENT_ID>" \
    "panw-client-secret=<YOUR_CLIENT_SECRET>" \
    "panw-tsg-id=<YOUR_TSG_ID>"
```

### 2. Deploy Container Revision & Bind Variables
```bash
az containerapp update \
  --name od-airs-scanner-api \
  --resource-group od-rg-prisma-airs-demo \
  --image ghcr.io/<YOUR_GITHUB_USERNAME>/airs-model-scanner:latest \
  --set-env-vars \
    "MODEL_SECURITY_CLIENT_ID=secretref:panw-client-id" \
    "MODEL_SECURITY_CLIENT_SECRET=secretref:panw-client-secret" \
    "TSG_ID=secretref:panw-tsg-id" \
    "MODEL_SECURITY_API_ENDPOINT=[https://api.sase.paloaltonetworks.com/aims](https://api.sase.paloaltonetworks.com/aims)"
```

### 3. API Execution Test (cURL)
Send a scan request for an AI model (e.g., Hugging Face `Phi-3-mini` GGUF) targeting your API endpoint:

```bash
curl -X POST "https://od-airs-scanner-api.mangosand-1ebd5c48.spaincentral.azurecontainerapps.io/api/v1/scan" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_INTERNAL_API_KEY>" \
  -d '{
    "model_url": "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf",
    "group_id": "<YOUR_SCM_GROUP_ID_UUID>"
  }'
```

> ⚠️ **Parameter Verification:**
> * **`x-api-key`**: Replace `<YOUR_INTERNAL_API_KEY>` with the exact token configured in your `internal_api_token` variable (the shared key generated for API access).
> * **`group_id`**: Replace `<YOUR_SCM_GROUP_ID_UUID>` with the UUID of your target Policy Group in Strata Cloud Manager. For reference, `2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32` is the UUID assigned to the default Hugging Face security policy group in SCM.

### 4. Strata Cloud Manager (SCM) Validation
1. Log in to **Strata Cloud Manager**.
2. Navigate to **AI Security > Prisma AIRS > Model Security > Scans**.
3. Verify that the scan execution log appears associated with your `group_id` UUID, displaying vulnerability analysis, license evaluation, and threat posture.

---


## 🚀 Step 5: Next Steps & SecOps Web Interface

While you can interact with the Prisma AIRS scanning backend via standard APIs (as tested above), we have developed a dedicated, Zero-Trust **SecOps Web Interface (Model Validation Hub)** for security operations teams. 

This Next.js portal provides a visual dashboard to trigger audits, inspect results, and dynamically manage SCM Policy Groups without interacting directly with the backend infrastructure.

👉 **[Deploy the SecOps Model Validation Hub](../../03-AI-Apps/02-service-apps)**

---

## 💰 FinOps & Ecosystem Positioning

### FinOps & Serverless Multi-Cloud Strategy
* **Scale-to-Zero Optimization**: Azure Container Apps scales down to `min_replicas = 0` during idle periods, resulting in **$0.00/hour compute costs** when no scans are active.
* **Multi-Cloud Portability**: The containerized engine is completely cloud-agnostic and can be deployed across:
  * **Azure**: Azure Container Apps (ACA) or Azure Kubernetes Service (AKS).
  * **AWS**: AWS App Runner, ECS Fargate, or EKS.
  * **GCP**: Google Cloud Run or GKE.

### Prisma AIRS Ecosystem & Runtime Security Synergy
Model & Skill Supply Chain Security represents the **Pre-Deployment / Static Guardrail** layer within the broader Palo Alto Networks AI Ecosystem:
* **Prisma AIRS (Supply Chain Security)**: Validates AI artifacts (GGUF, Safetensors, Pickle, Skill definitions) before they enter CI/CD pipelines or AI registries.
* **Prisma AIRS AI Gateway & Runtime Security**: Intercepts real-time LLM inference requests, enforcing DLP, prompt injection defense, and toxicity filtering.
* **AI GW **: Works alongside AI gateways and orchestration proxies to provide end-to-end observability, fallback routing, and real-time governance across multi-LLM enterprise deployments.

