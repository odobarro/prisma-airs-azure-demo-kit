output "workspace_details" {
  description = "Details of the Workspace (Scope) created in Prisma AIRS"
  value       = data.local_file.workspace_creation_result.content
}

output "integration_details" {
  description = "Details of the Global Azure OpenAI Integration"
  value       = data.local_file.integration_creation_result.content
}

output "security_api_key_details" {
  description = "Service credentials generated for dispatching prompts through Prisma AIRS"
  value       = data.local_file.workspace_apikey_result.content
  sensitive   = true
}