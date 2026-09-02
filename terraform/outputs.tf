output "openai_endpoint" {
  value       = azurerm_cognitive_account.openai.endpoint
  description = "El Endpoint de Azure OpenAI. Este es el que registraremos en Prisma AIRS Gateway."
}

output "storage_account_name" {
  value = azurerm_storage_account.stg.name
}