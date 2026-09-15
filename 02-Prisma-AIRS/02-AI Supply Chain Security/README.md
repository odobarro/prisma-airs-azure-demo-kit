> [!WARNING]
> **MODULE UNDER CONSTRUCTION / WORK IN PROGRESS**  
> This module is currently under active development and testing. Architecture specs, Terraform definitions, and CI/CD pipelines are subject to frequent updates. **Do not deploy in production environments yet.**

# Module 02: AI Supply Chain Security (Model Security in Prisma AIRS)

## What is AI Supply Chain Security?
AI innovation is transforming every industry, but beneath that progress lies a growing and often invisible attack surface: the AI supply chain. Foundation models, reusable skills, prompts, configurations, and supporting artifacts can introduce malicious code, hidden instructions, unsafe dependencies, or excessive privileges that traditional security tools are not designed to detect.

Prisma AIRS AI Supply Chain Security brings visibility, validation, and control to every AI artifact before it reaches production. By securing both AI models and agent skills through a unified platform, you can innovate confidently while protecting intellectual property, reducing operational risk, and maintaining regulatory trust.

* **Prevent threats before deployment** by identifying malicious code, unsafe execution paths, hidden instructions, and policy violations.
* **Accelerate AI adoption** by automating validation and reducing manual security reviews.
* **Preserve intellectual property** by scanning artifacts within your controlled environments.
* **Demonstrate governance and compliance** with audit-ready evidence and consistent policy enforcement.

### Core Capabilities
Prisma AIRS AI Supply Chain Security provides two core scanning capabilities that cover the full range of AI artifacts in your environment:

* **AI Model Security** scans model files for malicious code and backdoors, unsafe serialization formats, insecure dependencies, license violations, metadata anomalies, and architecture-based security risks.
* **AI Skill Security** scans agent skills for prompt manipulation and embedded instructions, arbitrary code execution, secret and credential access, unsafe shell commands, external network communication, data exfiltration risks, dangerous tool or model context protocol (MCP) usage, and hidden dependencies or privilege escalation.

Prisma AIRS continuously tracks security posture across both capability areas through centralized dashboards, threat intelligence updates, audit logs and scan history, compliance reporting, and organization-wide policy visibility.

## 📚 Resources & Official Documentation
For comprehensive technical details, implementation guides, and best practices, please refer to the official Palo Alto Networks documentation:

* 🔗 [Prisma AIRS - AI Supply Chain Security Documentation](https://docs.paloaltonetworks.com/ai-runtime-security/ai-model-security/ai-supply-chain-security)

---

## Architecture & FinOps Strategy
This solution deploys a serverless, API-driven orchestration layer that integrates the Prisma AIRS CLI. Designed to **minimize idle infrastructure overhead**, the architecture leverages:

1. **Frontend (Vercel / Cloudflare):** A lightweight administrative web UI acting as the SecOps control plane.
2. **Backend Engine (Azure Container Apps):** A Python FastAPI application that handles inbound webhooks, clones target repositories, and executes the scan asynchronously. It is configured to **scale to 0 replicas** when idle.
3. **Container Registry (GitHub Container Registry - GHCR):** Hosted via GHCR private packages to reduce dedicated registry storage overhead on Azure.

---

## Prerequisites

Ensure the following prerequisites are met prior to beginning the deployment:

* **Azure Cloud:** An active Azure Subscription with privileges to create Resource Groups and Azure Container Apps.
* **Local Tools:** Installed and configured binaries for `az CLI`, `terraform` (>= 1.5.0), `docker`, and `git`.
* **GitHub Account:** A GitHub user/org (`ghcr_username`) with a generated Personal Access Token (PAT) having `write:packages` and `read:packages` scopes.
* **Palo Alto Networks Portal:** Active administrative access to Strata Cloud Manager (SCM) and Customer Support Portal (CSP).

---

## Step 1: Licensing and Activation (CSP & SCM Setup)

Prisma AIRS Model Security is metered using **Palo Alto Networks Flex Credits**. To provision your tenant:

1. Log in to the [Palo Alto Networks Customer Support Portal (CSP)](https://support.paloaltonetworks.com/).
2. Create a **Deployment Profile (DP)** and allocate your designated Flex Credits to Prisma AIRS.
3. Map the Deployment Profile to your **Tenant Service Group (TSG)**.  
   > ⚠️ **Important:** The Tenant Service Group (TSG) **MUST be located in a supported region**.
4. Log in to **Strata Cloud Manager (SCM)**, navigate to **Settings > Service Accounts**, and obtain your `Client ID` and `Client Secret`.
   * **Note:** You can reuse the Service Account previously created in [`02-Prisma-AIRS/01-AI-Gateway`](../01-AI-Gateway/README.md).
   * **Custom RBAC:** If you prefer to enforce Least Privilege Access Control by creating a dedicated, more restrictive Service Account specifically for Model Security, refer to the [Official Palo Alto Networks IAM Configuration Guide](https://docs.paloaltonetworks.com/ai-runtime-security/ai-model-security/ai-supply-chain-security/model-security-to-secure-your-ai-models/get-started-with-ai-model-security/configure-identity-and-access-management).

> 📘 **Official Documentation:**  
> [Palo Alto Networks - Get Started with Prisma AIRS Model Security](https://docs.paloaltonetworks.com/ai-runtime-security/ai-model-security/ai-supply-chain-security)

---

## Step 2: Build and Push Container Image to GHCR

Before executing the Terraform deployment, the scanner container image must exist in your private GitHub Container Registry (GHCR). This repository includes an automated GitHub Actions CI/CD workflow (`.github/workflows/build-scanner.yml`) that compiles and publishes the image without requiring local Docker dependencies.

### Method A: Automated CI/CD via GitHub Actions (Recommended)

1. **Trigger the Workflow:** Commit and push your local repository changes (including the `app/` directory and `.github/` workflow configuration) to GitHub:
   ```bash
   git add .
   git commit -m "feat: initialize Prisma AIRS supply chain security module"
   git push origin main
   ```

2. **Monitor Pipeline Execution in GitHub Actions:**
   * Open your repository in the browser (`https://github.com/<YOUR_GITHUB_USERNAME_OR_ORG>/<YOUR_REPO_NAME>`).
   * Click on the **Actions** tab in the top repository navigation menu.
   * In the left sidebar, select the workflow **Build and Push Scanner Image to GHCR**.
   * Click on the active workflow run (e.g., `feat: initialize Prisma AIRS...`) to view real-time compilation and push logs.
   * Ensure all steps (`Checkout Code`, `Log in to GHCR`, `Build and Push`) complete with a green checkmark (**✓**).

3. **Verify Published Image in GHCR:**
   * Navigate to your GitHub Profile or Organization home page.
   * Select the **Packages** tab (or check the **Packages** section on the right sidebar of the repository main page).
   * Confirm that the package `airs-model-scanner` is visible and carries the `:latest` tag:
     `ghcr.io/<YOUR_GITHUB_USERNAME_OR_ORG>/airs-model-scanner:latest`

---

### Method B: Manual CLI Build (Optional Fallback)

If you are deploying in an environment without GitHub Actions enabled, you can build and push the image manually using a local or cloud Docker daemon:

```bash
# 1. Set environment variables
export GHCR_USERNAME="<YOUR_GITHUB_USERNAME_OR_ORG>"
export GHCR_PAT="<YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>"

# 2. Authenticate Docker CLI with GHCR
echo $GHCR_PAT | docker login ghcr.io -u $GHCR_USERNAME --password-stdin

# 3. Build and push image from the app/ directory
cd "02-Prisma-AIRS/02-AI Supply Chain Security/app"
docker build -t ghcr.io/$GHCR_USERNAME/airs-model-scanner:latest .
docker push ghcr.io/$GHCR_USERNAME/airs-model-scanner:latest
```

---

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
| `location` | **Yes** | `string` | Target Azure Region (e.g., `westeurope`). Must match `01-azure-openai-infrastructure`. |
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

## Step 4: Verification & API Testing

Validate the Azure Container App by issuing a test `POST` request from your local machine. The endpoint returns an immediate HTTP `202 Accepted` status while processing the scan asynchronously.

```bash
curl -X POST <YOUR_SCANNER_API_URL> \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_INTERNAL_API_TOKEN>" \
  -d '{
    "model_url": "[https://gitlab.com/gitlab-org/incubation-engineering/ai-assist/demo-model.git](https://gitlab.com/gitlab-org/incubation-engineering/ai-assist/demo-model.git)"
  }'
```

### Strata Cloud Manager Inspection
1. Log in to **Palo Alto Networks Strata Cloud Manager (SCM)**.
2. Navigate to **AI Security > Prisma AIRS > Model Security > Scans**.
3. Inspect the active scan execution logs and security posture telemetry generated by the backend worker.