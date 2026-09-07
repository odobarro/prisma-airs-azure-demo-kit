# 01-Public-Bot-Apps: Sector-Specific AI Chatbots

This directory contains lightweight, public-facing web applications designed to simulate external AI consumption across different industry verticals. 

As public interfaces exposed to unauthenticated users, these applications represent the highest risk surface for **Denial of Wallet (DoW)** attacks, **Prompt Injection**, and **Data Exfiltration**. They serve as the primary testing ground for partners to demonstrate **Palo Alto Networks Prisma AIRS** capabilities (AI Gateway, Idira inspection engine, FinOps, and threat prevention) in action.

---

## Deployed Verticals

*   `/app/retail` - Simulates a retail customer service and e-commerce portal with an embedded AI assistant.
*   *(Future)* `/app/finance` - Simulates a banking assistant handling sensitive queries.
*   *(Future)* `/app/industry` - Simulates a manufacturing or technical support agent.

---

## Architecture & Built-in Security Layer

This project uses **Next.js (App Router)** and includes pre-configured security and observability controls out of the box:

* **Layer 7 Edge Firewall (`middleware.ts`):** Validates the client source IP against `ALLOWED_IP` before executing any application logic, preventing unauthorized access and budget exhaustion.
* **AI Gateway Proxy (`app/api/route.ts`):** Encapsulates calls to the Prisma AIRS Gateway (`aigw.portkey.ai`). It abstracts underlying LLM keys and injects metadata tags (`x-portkey-custom-metadata`) for real-time tracking in **Strata Cloud Manager (SCM)**.
* **Retail Portal (`app/retail/page.tsx`):** A fully functional e-commerce frontend featuring an embedded assistant widget connected to the backend proxy.

---

## Deployment Guide: Direct to Vercel (Zero Local Dependencies)

To avoid installing Node.js, `npm`, or local dependencies on your machine, this project is optimized for direct deployment to **Vercel** via GitHub.

### 1. Push Code to GitHub

Commit and push all application files to your remote GitHub repository:

1. `git add .`
2. `git commit -m "feat: setup retail vertical with Prisma AIRS security layer"`
3. `git push origin main`

### 2. Import Repository into Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project** and import your GitHub repository.
3. In the **Root Directory** section, click Edit and set it to: `03-AI-Apps/01-Public-Bot-Apps`.
4. Leave the Framework Preset set to **Next.js**.

### 3. Configure Environment Variables in Vercel

Under **Environment Variables**, configure the following runtime variables:

- `ALLOWED_IP`: Your target public IP address allowed to access the demo.
- `PORTKEY_GATEWAY_URL`: `https://aigw.portkey.ai/v1`
- `PORTKEY_API_KEY`: Your Prisma AIRS Data Plane API Key (`p-key-...`).
- `PORTKEY_VIRTUAL_KEY`: Your Azure OpenAI Virtual Key (`v-key-...`).

Click **Deploy**. Vercel will build and host the application globally at the Edge.

---

## File Structure & Usage

| File / Path | Purpose | Environment Configuration |
| :--- | :--- | :--- |
| `middleware.ts` | Edge IP restriction firewall. | Controlled via `ALLOWED_IP` in Vercel Environment Variables. |
| `app/api/route.ts` | Backend API handler routing traffic to Prisma AIRS. | Adjust metadata or model aliases in payload if needed. |
| `app/retail/page.tsx` | Retail UI with embedded AI chat widget. | Accessible at `https://<your-vercel-domain>/retail`. |