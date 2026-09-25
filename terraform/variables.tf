variable "cloudflare_zone_id" {
  description = "The Cloudflare Zone ID for opexnal.com"
  type        = string
  default     = "placeholder_cloudflare_zone_id"
}

variable "origin_verify_secret" {
  description = "Cryptographic pre-shared secret injected into X-Origin-Verify header by edge CDN"
  type        = string
  sensitive   = true
  default     = "change_me_production_origin_secret_32_chars"
}

variable "enforce_origin_protection" {
  description = "Whether to block requests lacking the valid origin secret"
  type        = boolean
  default     = false
}
