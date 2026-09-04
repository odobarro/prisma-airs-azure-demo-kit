# ==============================================================================
# 1. Palo Alto Networks Management & Authentication Variables
# ==============================================================================
variable "panw_mgmt_client_id" {
  description = "Service Account Client ID for Palo Alto Networks Strata Cloud Manager"
  type        = string
}

variable "panw_mgmt_client_secret" {
  description = "Service Account Client Secret for Palo Alto Networks Strata Cloud Manager"
  type        = string
  sensitive   = true
}

variable "panw_mgmt_tsg_id" {
  description = "Tenant Service Group (TSG) ID acting as the scope for Prisma AIRS"
  type        = string
}

# ==============================================================================
# 2. Workspace Configuration
# ==============================================================================
variable "workspace_name" {
  description = "Name of the AI Gateway Workspace to create"
  type        = string
  default     = "ws-azure-demo"
}

variable "workspace_description" {
  description = "Operational description for the Workspace"
  type        = string
  default     = "Workspace for Azure OpenAI Governance & Security"
}

# ==============================================================================
# 3. Azure OpenAI Integration & Model Catalog Variables
# ==============================================================================
variable "azure_openai_api_key" {
  description = "API Key for the Azure OpenAI Instance"
  type        = string
  sensitive   = true
}

variable "azure_openai_resource_name" {
  description = "Enter the Resource Name / Subdomain of your configured Azure OpenAI Instance in Azure Portal (e.g. 'aoai-demo-secops')"
  type        = string
  # Interactive prompt in terminal - no default value
}

variable "azure_openai_deployment_name" {
  description = "Deployment name configured in Azure OpenAI Studio"
  type        = string
  default     = "gpt-4.1-mini-demo"
}

variable "azure_openai_foundation_model" {
  description = "Exact base foundation model version deployed in Azure OpenAI"
  type        = string
  default     = "gpt-4.1-mini-2025-04-14"
}

variable "azure_openai_model_alias" {
  description = "Friendly alias used to invoke the model in the Prisma AIRS Catalog"
  type        = string
  default     = "azure-gpt4mini-demo"
}

variable "azure_openai_api_version" {
  description = "API Version for Azure OpenAI Service"
  type        = string
  default     = "2024-06-01"
}