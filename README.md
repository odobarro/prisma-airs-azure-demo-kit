# Prisma AIRS & Azure OpenAI Demo Environment

An automated, enterprise-grade Infrastructure-as-Code (IaC) package using **Terraform** to deploy a serverless Azure AI environment.

Purpose-built for demonstrating **Palo Alto Networks Prisma AIRS** capabilities—including **AI Gateway**, **AI Runtime Security**, and **Prisma Model Security**

---

## Architecture

* **Azure OpenAI Service**: Deploys `gpt-4.1-mini`.
* **Azure Storage Account (`Standard_LRS`)**: Dedicated Blob Storage container for static AI model vulnerability scanning (`.pkl`, `.safetensors`, `.onnx` files) via **Prisma Model Security**.


---

## Prerequisites

Before running this deployment, ensure you have:

1. **Azure CLI**: Installed and logged in (`az login`).
2. **Terraform**: Version `>= 1.5.0` installed.
3. **Git**: Installed and configured with your credentials.
4. **Active Azure Subscription**: Permissions to create Resource Groups, Cognitive Services, and Storage Accounts.
5. **Prisma AIRS Tenant**: Admin/Developer access to configure Portkey AI Gateway keys, Runtime Guardrails, and Idira integrations.

---

## Step-by-Step Deployment Guide

1. **Clone & Set Up Local Repository**

    Clone the repository to your Mac/PC using VS Code or Git terminal:

    ```bash
    git clone [https://github.com/odobarro/prisma-airs-azure-demo-kit](https://github.com/odobarro/prisma-airs-azure-demo-kit)
    cd prisma-airs-azure-demo-kit
    ```

2. **Authenticate to Azure CLI**

    Log in to your Azure account in your terminal:

    ```bash
    az login
    ```

    *If you manage multiple subscriptions, select your active target:*

    ```bash
    az account set --subscription "YOUR_SUBSCRIPTION_ID_OR_NAME"
    ```

3. **Initialize & Apply Terraform**

    Navigate to the `terraform/` directory and initialize the AzureRM provider plugins:

    ```bash
    cd terraform
    terraform init
    ```

    Execute the deployment. Terraform will prompt you **interactively** for environment-specific parameters:

    ```bash
    terraform apply
    ```

    #### Interactive Prompt Reference

    | Parameter | Description | Input Example |
    |---|---|---|
    | `var.azure_location` | Target Azure Region | `spaincentral` |
    | `var.resource_group_name` | Name for the Azure Resource Group | `rg-partner-prisma-demo` |
    | `var.openai_account_name` | Globally unique Azure OpenAI account name | `oai-partner-demo-001` |
    | `var.storage_account_name` | Globally unique Storage Account name (lowercase alphanumeric only, 3-24 chars) | `stgpartnerdemo001` |
    | `var.storage_container_name` | Blob container name for Prisma Model Security scans | `ai-models-scan` |

    Review the execution plan in the terminal and type **`yes`** when prompted to confirm deployment.

4. **Retrieve the Primary API Key (Key1)**

```bash
az cognitiveservices account keys list \
  --name <your_openai_account_name> \
  --resource-group <your_resource_group> \
  --query "key1" -o tsv
```

5. **Confirm the Public Endpoint**

```bash
az cognitiveservices account show \
  --name <your_openai_account_name> \
  --resource-group <your_resource_group> \
  --query "properties.endpoint" -o tsv
  --query "key1" -o tsv
```
# Teardown & Resource Cleanup

## To completely remove all Azure resources:

```bash
cd terraform
terraform destroy
```

Type **`yes`** to confirm deletion.


*Important Azure OpenAI Soft-Delete Notice: Azure OpenAI enforces a 48-hour soft-delete retention policy by default. If you destroy the infrastructure and run terraform apply immediately using the same openai_account_name, Azure will reject it. Use a new name or purge the deleted resource via Azure CLI:*

```bash
az cognitiveservices account purge --name <OPENAI_ACCOUNT_NAME> --resource-group <RESOURCE_GROUP_NAME> --location <AZURE_LOCATION>
```