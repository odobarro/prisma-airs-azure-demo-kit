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
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# 2. Azure Container Apps Environment
resource "azurerm_container_app_environment" "env" {
  name                = "cae-${var.prefix}-${var.environment}"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
}

# 3. Azure Container App (FinOps Engine: Scale to 0)
resource "azurerm_container_app" "app" {
  name                         = "ca-${var.prefix}-${var.container_name}-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  # Encrypted Secret Store inside ACA
  secret {
    name  = "ghcr-pat"
    value = var.ghcr_pat
  }

  secret {
    name  = "panw-mgmt-client-secret"
    value = var.panw_mgmt_client_secret
  }

  secret {
    name  = "internal-api-token"
    value = var.internal_api_token
  }

  # Private GHCR Registry integration ($0 Cost Storage)
  registry {
    server               = "ghcr.io"
    username             = var.ghcr_username
    password_secret_name = "ghcr-pat"
  }

  # Ingress configuration (HTTPS Endpoint)
  ingress {
    external_enabled = true
    target_port      = 8000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = var.container_name
      image  = "ghcr.io/${var.ghcr_username}/airs-model-scanner:latest"
      cpu    = 1.0
      memory = "2.0Gi"

      env {
        name  = "PALO_ALTO_CLIENT_ID"
        value = var.panw_mgmt_client_id
      }
      env {
        name        = "PALO_ALTO_CLIENT_SECRET"
        secret_name = "panw-mgmt-client-secret"
      }
      env {
        name  = "PALO_ALTO_TSG_ID"
        value = var.panw_mgmt_tsg_id
      }
      env {
        name        = "INTERNAL_API_TOKEN"
        secret_name = "internal-api-token"
      }
    }
  }
}