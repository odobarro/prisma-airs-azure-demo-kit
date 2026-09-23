# 02-Service-Apps: SecOps AI Supply Chain Security Hub

This directory contains an isolated, dedicated SecOps web portal (**Model Validation Hub**) designed for security operations teams to perform pre-deployment analysis on AI models, datasets, and AI applications from sources like **Hugging Face** and **GitLab**.

As an internal security management interface, this application safeguards the AI development lifecycle against critical supply chain vectors: **Malicious Pickle/PyTorch Tensor Deserialization**, **Software Vulnerabilities (CVEs)**, **Non-compliant Open-Source Licensing (e.g., CC-BY-NC)**, and **Unvetted Agent Capabilities**. It serves as a primary demonstration platform for partners to showcase **Palo Alto Networks Prisma AIRS (AI Supply Chain Security)** integration with **Strata Cloud Manager (SCM)** policies.

---

## Deployed Verticals & Entry Points

* `/` - **Model Validation Hub:** Bilingual (ES | EN) SecOps dashboard to trigger static audits on model artifacts, inspect real-time telemetry from SCM, and dynamically manage (Create/Delete) Security Policy Groups mapped directly to the Palo Alto Networks tenant.

---

## Architecture & Built-in Security Layer

This project utilizes **Next.js 14+ (App Router)** and is deployed on **Vercel Edge Functions**. It establishes an isolated Zero-Trust proxy pattern connecting to a serverless **Azure Container Apps (ACA)** microservice in `spaincentral`:

```text
    [ SecOps Browser ] 
            │
            ▼
    [ Vercel Edge Firewall ]  ──► (middleware.ts: IP Whitelist)
            │ (200 OK)
            ▼
    [ Next.js API Proxy ]     ──► (app/api/scan & app/api/groups)
            │ (Zero-Trust: Hides ACA URL & Injects internal secrets)
            ▼
    [ Azure Container Apps ]  ──► (od-airs-scanner-api.mangosand-*.azurecontainerapps.io)
            │ (FastAPI backend + Prisma AIRS SDK)
            ▼
    [ Strata Cloud Manager ]  ──► (SCM Policy Evaluation, Group Management & Telemetry)
```

### Core Security & FinOps Features

* **Layer 7 Edge Firewall (`middleware.ts`):** Enforces strict IP-based access control at the Vercel Edge layer before executing server logic. Validates the client source IP against `ALLOWED_IPS`, handles IPv4/IPv6 address transitions, and returns a structured JSON 403 response for unauthorized origins.
* **Zero-Trust API Proxy:** Prevents client-side exposure of backend infrastructure. The Next.js server acts as a middleman, securely appending authentication headers and routing traffic to the internal Azure backend without exposing `AZURE_BACKEND_URL` to the browser.
* **FinOps Scale-to-Zero Architecture:** The Azure Container Apps backend is configured with dynamic KEDA auto-scaling down to 0 replicas. *FinOps Pro-Tip: This ensures Partners incur $0.00 compute costs when the SecOps portal is not actively scanning a model, making it highly cost-effective for PoCs and global demos.*

---

## Prerequisites

Before deploying this SecOps frontend, you must have the backend scanning microservice and Strata Cloud Manager policy engine fully provisioned:

1. **Prisma AIRS AI Supply Chain Security Backend:** Ensure the Azure Container Apps scanner API and SCM policy group integrations are active. Reference the deployment guide here: `../../02-Prisma-AIRS/02-AI Supply Chain Security/`

---

## Deployment Guide: Direct to Vercel (Zero Local Dependencies)

This project is structured for automated deployment directly to **Vercel** via GitHub, eliminating the need for local Node.js or `npm` installations.

### 1. Push Code to GitHub

Commit and push all application files to your remote GitHub repository:

```bash
git add .
git commit -m "feat(secops): deploy Prisma AIRS Model Security Hub with SCM Group Management"
git push origin main
```

### 2. Import Repository into Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project** and select your GitHub repository.
3. In the **Root Directory** section, click **Edit** and set it strictly to: `03-AI-Apps/02-service-apps`.
4. Keep the Framework Preset set to **Next.js**.

### 3. Configure Environment Variables in Vercel

Under **Environment Variables**, configure the following runtime keys:

| Variable Name | Purpose & Format | Example Value |
| :--- | :--- | :--- |
| `ALLOWED_IPS` | Comma-separated list of allowed public client IPs (IPv4/IPv6) authorized to access the SecOps hub. | `185.34.12.5, 2a02:1234::1` |
| `AZURE_BACKEND_URL` | **(Required)** Full HTTPS Base URL of your Azure Container Apps backend. *Do NOT include trailing slashes or pathing.* | `[https://od-airs-scanner-api.mangosand-1ebd5c48.spaincentral.azurecontainerapps.io](https://od-airs-scanner-api.mangosand-1ebd5c48.spaincentral.azurecontainerapps.io)` |
| `SCANNER_INTERNAL_API_KEY` | *(Optional)* Secret x-api-key if you enabled ingress authentication on your Azure Container App. | `4f8a91b2c3d4e5f67890...` |

Click **Deploy**. Vercel will build and host the application at the Edge.

---

## Edge IP Security & Troubleshooting Workflow

If you receive an **Access Denied (403)** error when accessing the SecOps portal, your current public IP is being blocked by the `middleware.ts` Edge filter.

1. **Identify Client IP:** The custom middleware intercepts blocked traffic and outputs your current public IP inside the raw 403 JSON payload response.
2. **Update Environment Variable:** In Vercel, navigate to **Project Settings** > **Environment Variables**. Edit `ALLOWED_IPS` and append your detected IP address (comma-separated). Click **Save**.
3. **Trigger Edge Redeploy (Mandatory