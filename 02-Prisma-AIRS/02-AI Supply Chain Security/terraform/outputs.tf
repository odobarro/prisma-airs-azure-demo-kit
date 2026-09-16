# ------------------------------------------------------------------------------
# Azure Infrastructure & API Outputs
# ------------------------------------------------------------------------------

output "scanner_api_url" {
  value       = "https://${azurerm_container_app.app.ingress[0].fqdn}/api/v1/scan"
  description = "Public HTTPS Endpoint URL for the Prisma AIRS Model Security scanner API. Use this endpoint in Vercel or cURL."
}

output "container_app_fqdn" {
  value       = azurerm_container_app.app.ingress[0].fqdn
  description = "Fully Qualified Domain Name (FQDN) of the Azure Container App instance."
}

output "resource_group_name" {
  description = "The name of the existing Azure Resource Group."
  value       = data.azurerm_resource_group.rg.name
}

output "container_app_name" {
  value       = azurerm_container_app.app.name
  description = "The name of the deployed Azure Container App resource."
}