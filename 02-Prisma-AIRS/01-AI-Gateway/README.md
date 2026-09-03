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