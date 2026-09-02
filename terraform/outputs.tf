output "openai_endpoint" {
  value       = azurerm_cognitive_account.openai.endpoint
  description = "Azure OpenAI Endpoint URL to register in Prisma AIRS (Portkey AI Gateway)"
}

output "storage_account_name" {
  value       = azurerm_storage_account.stg.name
  description = "Storage Account name ready for Prisma Model Security integration"
}