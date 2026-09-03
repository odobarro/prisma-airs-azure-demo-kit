variable "panw_mgmt_client_id" {
  type        = string
  description = "SCM Management OAuth Client ID"
  sensitive   = true
}

variable "panw_mgmt_client_secret" {
  type        = string
  description = "SCM Management OAuth Client Secret"
  sensitive   = true
}

variable "panw_mgmt_tsg_id" {
  type        = string
  description = "Palo Alto Networks Tenant Service Group (TSG) ID"
}

variable "workspace_name" {
  type        = string
  description = "Name of the workspace to create in Prisma AIRS"
  default     = "ws-azure-demo"
}

variable "workspace_description" {
  type        = string
  description = "Description of the workspace purpose"
  default     = "Workspace for Azure OpenAI Governance & Security"
}