variable "azure_location" {
  type        = string
  default     = "eastus"
  description = "Región de Azure. Usamos East US por la alta disponibilidad de modelos GPT."
}

variable "prefix" {
  type        = string
  default     = "airsdemo"
  description = "Prefijo para los nombres de los recursos (evita guiones para el Storage Account)"
}