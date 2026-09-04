output "workspace_details" {
  description = "Detalles del Workspace (Scope) creado en Prisma AIRS"
  value       = data.local_file.workspace_creation_result.content
}

output "integration_details" {
  description = "Detalles de la Integración Global de Azure OpenAI"
  value       = data.local_file.integration_creation_result.content
}

output "security_api_key_details" {
  description = "Credenciales generadas para lanzar Prompts contra Prisma AIRS"
  value       = data.local_file.workspace_apikey_result.content
  sensitive   = true
}