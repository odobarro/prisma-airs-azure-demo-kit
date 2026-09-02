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

# 3. LLM Model Deployment (Target endpoint for Prisma Runtime Firewall)
resource "azurerm_cognitive_deployment" "gpt_model" {
  name                 = var.model_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai.id
  model {
    format  = "OpenAI"
    name    = var.model_name
    version = var.model_version
  }
  scale {
    type = "Standard"
  }
}

# 4. Storage Account for Prisma Model Security (Static model file scanning)
resource "azurerm_storage_account" "stg" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "models_container" {
  name                  = var.storage_container_name
  storage_account_name  = azurerm_storage_account.stg.name
  container_access_type = "private"
}