terraform {
  required_version = ">= 1.5.0"
}

# ==============================================================================
# 1. Lifecycle Management: Prisma AIRS AI Gateway Workspace (Scope)
# ==============================================================================
resource "null_resource" "create_prisma_workspace" {
  triggers = {
    workspace_name = var.workspace_name
    tsg_id         = var.panw_mgmt_tsg_id
    client_id      = var.panw_mgmt_client_id
    client_secret  = var.panw_mgmt_client_secret
  }

  provisioner "local-exec" {
    environment = {
      PANW_MGMT_CLIENT_ID     = var.panw_mgmt_client_id
      PANW_MGMT_CLIENT_SECRET = var.panw_mgmt_client_secret
      PANW_MGMT_TSG_ID        = var.panw_mgmt_tsg_id
    }

    command = <<EOT
      set -eo pipefail
      airs aigateway workspace create \
        --name "${var.workspace_name}" \
        --description "${var.workspace_description}" \
        --scope-name "profile tsg_id:${var.panw_mgmt_tsg_id} email" \
        --output json > workspace_creation_response.json
    EOT
  }

  provisioner "local-exec" {
    when = destroy
    environment = {
      PANW_MGMT_CLIENT_ID     = self.triggers.client_id
      PANW_MGMT_CLIENT_SECRET = self.triggers.client_secret
      PANW_MGMT_TSG_ID        = self.triggers.tsg_id
    }
    # Archiva el workspace (Destruye en cascada todo lo que hay dentro, incluidas las API Keys)
    command = "airs aigateway workspace archive \"${self.triggers.workspace_name}\" --force"
  }
}

# ==============================================================================
# 2. Azure OpenAI Integration (Global/Tenant Level)
# ==============================================================================
resource "null_resource" "create_azure_openai_integration" {
  depends_on = [null_resource.create_prisma_workspace]

  triggers = {
    integration_slug = "az-openai-gpt-4-1"
    client_id        = var.panw_mgmt_client_id
    client_secret    = var.panw_mgmt_client_secret
    tsg_id           = var.panw_mgmt_tsg_id
  }

  provisioner "local-exec" {
    environment = {
      PANW_MGMT_CLIENT_ID     = var.panw_mgmt_client_id
      PANW_MGMT_CLIENT_SECRET = var.panw_mgmt_client_secret
      PANW_MGMT_TSG_ID        = var.panw_mgmt_tsg_id
    }

    command = <<EOT
      set -eo pipefail
      airs aigateway integrations create \
        --ai-provider-id "05defd2e-31ce-11ee-b93b-0e06f1aa7f7c" \
        --name "AZ OpenAI GPT_4_1" \
        --slug "az-openai-gpt-4-1" \
        --organisation-id "${var.panw_mgmt_tsg_id}" \
        --key "${var.azure_openai_api_key}" \
        --configurations '${jsonencode({
          azure_auth_mode     = "default"
          azure_resource_name = var.azure_openai_resource_name
          azure_deployment_config = [
            {
              alias                 = "azure-gpt4mini-demo"
              azure_api_version     = var.azure_openai_api_version
              azure_deployment_name = var.azure_openai_deployment_name
              is_default            = true
              azure_model_slug      = "gpt-4.1-mini-2025-04-14"
            }
          ]
        })}' \
        --output json > integration_creation_response.json
    EOT
  }

  provisioner "local-exec" {
    when = destroy
    environment = {
      PANW_MGMT_CLIENT_ID     = self.triggers.client_id
      PANW_MGMT_CLIENT_SECRET = self.triggers.client_secret
      PANW_MGMT_TSG_ID        = self.triggers.tsg_id
    }
    # Quitamos el '|| true' para que si falla la destrucción, Terraform nos muestre el error real de SCM
    command = "airs aigateway integrations delete --slug \"${self.triggers.integration_slug}\" --force"
  }
}

# ==============================================================================
# 3. Workspace API Key Generation (Data Plane Credentials para Testing)
# ==============================================================================
resource "null_resource" "create_workspace_api_key" {
  depends_on = [null_resource.create_prisma_workspace]

  triggers = {
    client_id     = var.panw_mgmt_client_id
    client_secret = var.panw_mgmt_client_secret
    tsg_id        = var.panw_mgmt_tsg_id
  }

  provisioner "local-exec" {
    environment = {
      PANW_MGMT_CLIENT_ID     = var.panw_mgmt_client_id
      PANW_MGMT_CLIENT_SECRET = var.panw_mgmt_client_secret
      PANW_MGMT_TSG_ID        = var.panw_mgmt_tsg_id
    }

    command = <<EOT
      set -eo pipefail

      # Extraemos el ID del Workspace recién creado
      WS_ID=$(grep -E -i -o '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' workspace_creation_response.json | head -1)

      if [ -z "$WS_ID" ]; then
        echo "Error: No se pudo extraer el WS_ID para crear la API Key."
        exit 1
      fi

      echo "--> Generando API Key Service-to-Service para Pruebas..."

      # Creamos la llave con permisos de inferencia y logs
      airs aigateway api-keys service create \
        --workspace "$WS_ID" \
        --organisation-id "${var.panw_mgmt_tsg_id}" \
        --scopes "completions.write,prompts.render,logs.write" \
        --type "workspace" \
        --name "tf-demo-testing-key" \
        --show-secret \
        --output json > workspace_apikey_response.json
        
      echo "--> API Key generada con éxito."
    EOT
  }
}

# ==============================================================================
# 4. Outputs de Infraestructura
# ==============================================================================
data "local_file" "workspace_creation_result" {
  depends_on = [null_resource.create_prisma_workspace]
  filename   = "${path.module}/workspace_creation_response.json"
}

data "local_file" "integration_creation_result" {
  depends_on = [null_resource.create_azure_openai_integration]
  filename   = "${path.module}/integration_creation_response.json"
}

data "local_file" "workspace_apikey_result" {
  depends_on = [null_resource.create_workspace_api_key]
  filename   = "${path.module}/workspace_apikey_response.json"
}