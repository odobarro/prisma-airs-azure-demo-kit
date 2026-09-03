output "existing_workspaces" {
  value       = data.local_file.workspaces_list_result.content
  description = "Lista actual de Workspaces configurados en Prisma AIRS"
}