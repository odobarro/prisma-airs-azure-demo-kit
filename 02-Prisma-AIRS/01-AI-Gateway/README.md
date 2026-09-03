# 01. Prisma AIRS - AI Gateway Integration Guide

## Introduction

The **Prisma AIRS AI Gateway** provides a centralized security, governance, and observability layer for all AI traffic in your organization — including LLM prompts, Model Context Protocol (MCP) interactions, and agent-to-agent (A2A) communication. 

Managed through **Palo Alto Networks Strata Cloud Manager (SCM)**, it supports two deployment models:

* **SaaS** — Enabled by default. No additional infrastructure setup required. Scales automatically with built-in high availability. **(This is the deployment model used in this guide)**.
* **Hybrid** — Hosts the Data Plane in your own environment using containerized deployments (Helm charts on Kubernetes), managed centrally via SCM for maximum resiliency and data residency control.

> 📘 **Official Documentation Reference:**  
> [Palo Alto Networks - Configure AI Gateway Administration Guide](https://docs.paloaltonetworks.com/ai-runtime-security/administration/configure-ai-gateway)

---

## Step-by-Step AI Gateway Deployment & Integration with Azure OpenAI

### 1. Licensing and Activation

AI Gateway is licensed using **Palo Alto Networks Flex Credits**. All metering is based on real-time token consumption across prompts, responses, tool calls, and agent interactions.

* **Token Metering Baseline:** $1 \text{ token} \approx 4 \text{ characters}$ of text (industry standard).
* **Sizing:** License your instance based on the maximum expected monthly token throughput.

#### Activation Steps

* Create a **Deployment Profile (DP)** in Strata Cloud Manager (SCM) and allocate Flex Credits to AI Gateway.
* Indicate preferred deployment mode (*SaaS* or *Hybrid*) — tracking purpose only, not enforced.
* Map the Deployment Profile to a **Tenant Service Group (TSG)** to link SCM and the Licensing System (SLS) to AI Gateway.  
  > ⚠️ The Tenant Service Group (TSG) **MUST be located in the Americas Region**.
* Launch SCM to complete setup and configuration.

---

### 2. SaaS Onboarding

The SaaS Gateway is enabled by default. After licensing activation, you can start routing AI traffic through the gateway immediately — no infrastructure work required.

### 3. Service Account and Role Setup in SCM

To automate the creation of Workspaces, Virtual Keys, Providers,... via APIs, you must create a dedicated Service Account in Strata Cloud Manager (SCM).

#### Step 1: Create the Custom Role

1. Access **Strata Cloud Manager** ([stratacloudmanager.paloaltonetworks.com](https://stratacloudmanager.paloaltonetworks.com/)).
2. Navigate to **System Settings** -> **Identity & Access Management** -> **Roles** -> **Custom Roles**.
3. Click **Add Role**, set **Name** to `airs_automation_role`, and **Description** to `Custom role for AIRS automation`.
4. In the permissions matrix, enable:
   * **AI Security**
   * **AI Model Security**
   * **AI Agent Fabric**  
   <p align="center">
   <img src="./images/Custom_Role.png" alt="Custom Role Permissions SCM" width="750"/>
   </p>
   *(Note: These global options are enabled so this same service account can be reused across all other modules in this repository. If you prefer a strictly restricted approach, you can limit the scope exclusively to AI Runtime Security / Gateway Management capabilities).*
5. Click **Save** to store the role definition within your Tenant Service Group (TSG).

#### Step 2: Provision the Service Account

1. Under **System Settings** -> **Identity & Access Management** ->  **Access Management** select **Add Identity**.
2. Identity Type **Service Account**, set the Service Account Name to **sa-prisma-airs-automation** and Description (optional) **Service Account for AIRS Automation** and them click **Next**
   <p align="center">
   <img src="./images/Service_Account_1.png" alt="Service Account 1" width="750"/>
   </p>
3. Copy and save in a secure place the **Client ID** and **Client Secret** and click **Next**
   <p align="center">
   <img src="./images/Service_Account_2.png" alt="Service Account 2" width="750"/>
   </p>
4. In Assign Roles select the custom role **airs_automation_role** and click Submit
   <p align="center">
   <img src="./images/Service_Account_3.png" alt="Service Account 3" width="750"/>
   </p>
