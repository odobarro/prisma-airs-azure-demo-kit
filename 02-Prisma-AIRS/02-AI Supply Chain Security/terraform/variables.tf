# ------------------------------------------------------------------------------
# Regional & Environment Settings (Prompted Interactively)
# ------------------------------------------------------------------------------

variable "location" {
  type        = string
  description = "Azure region where resources will be deployed (e.g., westeurope, eastus). Must match 01-azure-openai-infrastructure."
}

variable "prefix" {
  type        = string
  description = "Resource prefix used across modules to maintain naming standards (e.g., 'airs', 'company-ai')."
}

variable "environment" {
  type        = string
  description = "Deployment environment identifier (e.g., dev, stg, prd)."
}
variable "resource_group_name" {
  type        = string
  description = "Name of the existing Azure Resource Group to deploy the Container App into."
  # No default value provided to force an interactive prompt if omitted
}

# ------------------------------------------------------------------------------
# GitHub Container Registry (GHCR) Settings
# ------------------------------------------------------------------------------

variable "ghcr_username" {
  type        = string
  description = "GitHub username or Organization name (e.g., 'odobarro') that owns the container image."
}

variable "ghcr_pat" {
  type        = string
  sensitive   = true
  description = "GitHub Personal Access Token (PAT) with 'read:packages' scope to pull private images."
}

# ------------------------------------------------------------------------------
# Palo Alto Networks Strata Cloud Manager (SCM) Credentials
# ------------------------------------------------------------------------------

variable "panw_mgmt_client_id" {
  type        = string
  sensitive   = true
  description = "Client ID of the Service Account generated in Palo Alto Networks Strata Cloud Manager (SCM)."
}

variable "panw_mgmt_client_secret" {
  type        = string
  sensitive   = true
  description = "Client Secret of the Service Account generated in Palo Alto Networks Strata Cloud Manager (SCM)."
}

variable "panw_mgmt_tsg_id" {
  type        = string
  description = "Tenant Service Group ID (TSG ID) associated with your Palo Alto Networks account."
}

# ------------------------------------------------------------------------------
# Security & API Integration Keys
# ------------------------------------------------------------------------------

variable "internal_api_token" {
  type        = string
  sensitive   = true
  description = "Shared secret key used to authenticate inbound requests from Vercel or cURL clients to the Azure endpoint."
}

# ------------------------------------------------------------------------------
# Container & App Naming Settings (Prompted Interactively)
# ------------------------------------------------------------------------------

variable "container_name" {
  type        = string
  description = "Name of the container instance inside Azure Container Apps (e.g., 'airs-scanner-api' or a custom partner name)."
}