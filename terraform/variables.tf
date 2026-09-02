# =======================================================
# INTERACTIVE VARIABLES (Prompted during deployment)
# =======================================================

variable "azure_location" {
  type        = string
  description = "Target Azure region (e.g., spaincentral, westeurope, eastus)"
}

variable "resource_group_name" {
  type        = string
  description = "Name for the Azure Resource Group (e.g., rg-airs-demo)"
}

variable "openai_account_name" {
  type        = string
  description = "Globally unique name for the Azure OpenAI instance (e.g., oai-airs-demo-001)"
}

variable "storage_account_name" {
  type        = string
  description = "Globally unique Storage Account name (lowercase alphanumeric only, 3-24 chars)"
}

variable "storage_container_name" {
  type        = string
  description = "Blob container name for Prisma Model Security static scans (e.g., ai-models-scan)"
}

# =======================================================
# STATIC VARIABLES (Fixed defaults for zero-idle cost)
# =======================================================

variable "model_deployment_name" {
  type        = string
  default     = "gpt-4o-mini-demo"
  description = "Deployment alias used by Prisma AIRS"
}

variable "model_name" {
  type        = string
  default     = "gpt-4o-mini"
  description = "Base LLM model provided by Azure OpenAI"
}

variable "model_version" {
  type        = string
  default     = "2024-10-01"
  description = "Version of the OpenAI model"
}