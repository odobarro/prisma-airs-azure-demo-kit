terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }
}

provider "azurerm" {
  features {}
}

# 1. Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.azure_location
}

# 2. Azure OpenAI Service ($0 idle cost, Pay-As-You-Go)
resource "azurerm_cognitive_account" "openai" {
  name                  = var.openai_account_name
  location              = azurerm_resource_group.rg.location
  resource_group_name   = azurerm_resource_group.rg.name
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = var.openai_account_name
}

# 3. LLM Model Deployment (Target endpoint for Portkey AI Gateway & Prisma AIRS Firewall)
resource "azurerm_cognitive_deployment" "gpt_model" {
  name                 = var.model_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai.id
  model {
    format = "OpenAI"
    name   = var.model_name
    # Se omite 'version' para auto-asignar la versión activa soportada por Azure OpenAI
  }
  scale {
    type = "GlobalStandard"
  }
}

# 4. Storage Account for Prisma Model Security
resource "azurerm_storage_account" "stg" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# 5. Blob Container (Se crea MIENTRAS el acceso a red está abierto para la API de Terraform)
resource "azurerm_storage_container" "models_container" {
  name                  = var.storage_container_name
  storage_account_name  = azurerm_storage_account.stg.name
  container_access_type = "private"
}

# 6. Network Lockdown (Se aplica DESPUÉS de crear el contenedor para cumplir la Azure Policy CSB)
resource "azurerm_storage_account_network_rules" "stg_rules" {
  storage_account_id = azurerm_storage_account.stg.id
  default_action     = "Deny"
  bypass             = ["AzureServices"]

  depends_on = [azurerm_storage_container.models_container]
}