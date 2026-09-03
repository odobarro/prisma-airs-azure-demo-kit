# Prisma AIRS & Azure OpenAI Demo Environment

An automated, enterprise-grade Infrastructure-as-Code (IaC) package using **Terraform** to deploy a serverless Azure AI environment.

Purpose-built for demonstrating **Palo Alto Networks Prisma AIRS** capabilities like **AI Gateway**, **AI Runtime Security**, **AI Supply Chain Security**, **AI RedTeaming**, ...

---

## Architecture

* **Azure OpenAI Service**: Deploys `gpt-4.1-mini`.
* **Azure Storage Account (`Standard_LRS`)**: Dedicated Blob Storage container for AI model vulnerability scanning (`.pkl`, `.safetensors`, `.onnx` files) via **Prisma Model Security**.


---

## Prerequisites

Before running this deployment, ensure you have:

1. **Azure CLI**: Installed and logged in (`az login`).
2. **Terraform**: Version `>= 1.5.0` installed.
3. **Git**: Installed and configured with your credentials.
4. **Active Azure Subscription**: Permissions to create Resource Groups, Cognitive Services, and Storage Accounts.
5. **Prisma AIRS Tenant**: Admin/Developer access to configure AI Gateway, Runtime Guardrails, and other integrations.

---
