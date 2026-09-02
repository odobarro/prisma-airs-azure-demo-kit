terraform {
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

# 1. Grupo de Recursos
resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.prefix}-paloalto"
  location = var.azure_location
}

# 2. Azure OpenAI (Motor LLM - Coste $0 en reposo)
resource "azurerm_cognitive_account" "openai" {
  name                = "oai-${var.prefix}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  kind                = "OpenAI"
  sku_name            = "S0" # Nivel Standard (Pay-As-You-Go)
  custom_subdomain_name = "oai-${var.prefix}-domain"
}

# Despliegue del modelo GPT-4o-mini
resource "azurerm_cognitive_deployment" "gpt_model" {
  name                 = "gpt-4o-mini-demo"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  model {
    format  = "OpenAI"
    name    = "gpt-4o-mini"
    version = "2024-07-18"
  }
  scale {
    type = "Standard"
  }
}

# 3. Almacenamiento para Prisma Model Security (Escaneo de .pkl/.safetensors)
resource "azurerm_storage_account" "stg" {
  name                     = "stg${var.prefix}models"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS" # Replicación local, la más barata
}

resource "azurerm_storage_container" "models_container" {
  name                  = "ai-models-scan"
  storage_account_name  = azurerm_storage_account.stg.name
  container_access_type = "private"
}