# 01-Public-Bot-Apps: Sector-Specific AI Chatbots

This directory contains lightweight, public-facing web applications designed to simulate external AI consumption across different industry verticals. 

As public interfaces exposed to unauthenticated users, these applications represent the highest risk surface for **Denial of Wallet (DoW)** attacks, **Prompt Injection**, and **Data Exfiltration**. They serve as the primary testing ground for partners to demonstrate **Palo Alto Networks Prisma AIRS** capabilities (AI Gateway, Idira inspection engine, FinOps, and threat prevention) in action.

---

## Deployed Verticals

* `/app/retail` - Simulates a retail customer service and e-commerce portal with an embedded AI assistant.
* *(Future)* `/app/finance` - Simulates a banking assistant handling sensitive queries.
* *(Future)* `/app/industry` - Simulates a manufacturing or technical support agent.

---

## Architecture & Built-in Security Layer

This project uses **Next.js (App Router)** and is deployed globally on **Vercel Edge Functions**. It incorporates a multi-layer defense-in-depth architecture:

    [ Client Browser ] 
            │
            ▼
    [ Vercel Edge Firewall ] ──► (middleware.ts: IP Whitelist)
            │ (200 OK)
            ▼
    [ Next.js API Handler ]  ──► (app/api/route.ts: POST /api - SCM Metadata)
            │
            ▼
    [ Prisma AIRS Gateway ]  ──► (aigw.portkey.ai)
            │
            ▼
    [ Azure OpenAI Model ]   ──► (gpt-4.1-mini)

### Core Security & Observability Features

* **Layer 7 Edge Firewall (`middleware.ts`):** Validates the client source IP against `ALLOWED_IP` before executing any application logic. Cleans the `x-forwarded-for` proxy header to extract the true client IP, supports multi-IP whitelisting (comma-separated), handles dynamic IPv4/IPv6 transitions, and returns a structured JSON 403 payload with IP diagnostic data to prevent budget exhaustion.
* **AI Gateway Proxy (`app/api/route.ts`):** Serves as an isolated serverless API handler (`POST /api`). It encapsulates calls to the Prisma AIRS Gateway (`aigw.portkey.ai`), abstracts raw Azure OpenAI credentials using **Virtual Keys**, and injects custom FinOps metadata (`vertical: 'retail'`, `app_name: 'public-retail-portal'`) for real-time tracking in **Strata Cloud Manager (SCM)**.
* **Retail Portal UI (`app/retail/page.tsx`):** A modern, bilingual (ES | EN) e-commerce interface featuring a 6-product catalog, category filtering, rating badges, and an embedded floating AI chat widget connected to the secured proxy endpoint.

---

## Prerequisites

Before deploying this frontend application, you must have the foundational cloud infrastructure and Prisma AIRS AI Gateway configurations fully provisioned:

1. **Azure Infrastructure:** Ensure the backend Azure OpenAI service (`gpt-4.1-mini`) is active. Reference the deployment guide here: `../../01-azure-openai-infrastructure/`
2. **Prisma AIRS AI Gateway:** Ensure your AI Gateway Data Plane is configured with valid Virtual Keys pointing to your Azure endpoint. Reference the setup guide here: `../../02-Prisma-AIRS/01-AI-Gateway/`

---

## Deployment Guide: Direct to Vercel (Zero Local Dependencies)

To avoid installing Node.js, `npm`, or local dependencies on your machine, this project is optimized for direct automated deployment to **Vercel** via GitHub.

### 1. Push Code to GitHub

Commit and push all application files to your remote GitHub repository:

    git add .
    git commit -m "feat: setup retail vertical with Prisma AIRS security layer"
    git push origin main

### 2. Import Repository into Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project** and import your GitHub repository.
3. In the **Root Directory** section, click Edit and set it to: `03-AI-Apps/01-Public-Bot-Apps`.
4. Leave the Framework Preset set to **Next.js**.

### 3. Configure Environment Variables in Vercel

Under **Environment Variables**, configure the following runtime variables:

| Variable Name | Purpose & Format | Example Value |
| :--- | :--- | :--- |
| `ALLOWED_IP` | Comma-separated list of allowed client public IPs (IPv4/IPv6) to access the demo. | `185.34.12.5, 2a02:1234::1` |
| `PORTKEY_GATEWAY_URL` | Base URL of the Prisma AIRS AI Gateway. | `https://aigw.portkey.ai/v1` |
| `PORTKEY_API_KEY` | Your Prisma AIRS Data Plane API Key. | `p-key-...` |
| `PORTKEY_VIRTUAL_KEY` | Virtual Key routing traffic securely to your Azure OpenAI model. | `v-key-...` |

Click **Deploy**. Vercel will build and host the application globally at the Edge.

---

## Edge IP Security & Troubleshooting Workflow

When accessing the deployed application at `https://<your-vercel-domain>/retail`, you may encounter an **Access Denied (403)** error due to ISP network routing (IPv4 vs. IPv6 switching).

1. **Identify Received IP:** The custom `middleware.ts` returns a JSON payload displaying your detected client IP.
2. **Update Environment Variable:** In Vercel, go to **Settings** > **Environment Variables**. Edit `ALLOWED_IP` and append the detected IP (separated by a comma). Click **Save**.
3. **Trigger Edge Redeploy (Mandatory):** Go to the **Deployments** tab in Vercel, click the three dots (`...`) next to the latest deployment, and select **Redeploy**. *Edge Functions compile environment variables at build time; a redeploy is required.*

---

## SecOps & FinOps Validation (Baseline Observability)

Once the portal is accessible and connected to the AI Gateway, execute security testing directly through the chat widget.

### Test 1: Standard Contextual Query (Baseline)
* **Prompt:** *"What are the store's shipping policies?"*
* **Expected Result:** The assistant responds within the boundaries set by the System Prompt.
* **Telemetry:** Logged in Strata Cloud Manager / Portkey with input/output token counts and calculated cost (e.g., ~$0.0007).

---

## File Structure & Usage

| File / Path | Purpose | Environment Configuration |
| :--- | :--- | :--- |
| `middleware.ts` | Edge IP restriction firewall. | Controlled via `ALLOWED_IP` in Vercel Environment Variables. |
| `app/api/route.ts` | Backend API handler routing traffic to Prisma AIRS. | Adjust metadata or model aliases in payload if needed. |
| `app/retail/page.tsx` | Retail UI with embedded AI chat widget. | Accessible at `https://<your-vercel-domain>/retail`. |