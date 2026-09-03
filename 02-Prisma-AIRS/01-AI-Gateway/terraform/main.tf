terraform {
  required_version = ">= 1.5.0"
}

# Consultar la lista actual de Workspaces en Prisma AIRS / Portkey AI Gateway
resource "null_resource" "list_prisma_workspaces" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    environment = {
      PANW_MGMT_CLIENT_ID     = var.panw_mgmt_client_id
      PANW_MGMT_CLIENT_SECRET = var.panw_mgmt_client_secret
      PANW_MGMT_TSG_ID        = var.panw_mgmt_tsg_id
    }

    command = <<EOT
      npx @cdot65/prisma-airs-cli aigateway workspace list > workspaces_list_response.json
    EOT
  }
}

# Leer el archivo JSON resultante generado por la CLI
data "local_file" "workspaces_list_result" {
  depends_on = [null_resource.list_prisma_workspaces]
  filename   = "${path.module}/workspaces_list_response.json"
}