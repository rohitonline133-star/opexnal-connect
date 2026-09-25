/**
 * ==============================================================================
 * OPEXNAL GLOBAL EDGE SECURITY & DDOS MITIGATION INFRASTRUCTURE (TERRAFORM)
 * Production Edge Provider: Cloudflare Enterprise / Business Architecture
 *
 * STATUS: PROVIDER CONFIGURATION REQUIRED
 * This configuration specifies the end-to-end edge perimeter:
 * 1. Cloudflare DNS Proxying (Proxied Anycast A/AAAA/CNAME records)
 * 2. Edge TLS 1.3 & Authenticated Origin Pulls (Strict mTLS)
 * 3. HTTP DDoS Attack Protection Managed Ruleset
 * 4. Layer 7 Custom Edge WAF & OWASP Core Ruleset
 * 5. Multi-Tier Edge Rate Limiting (Auth, AI, API)
 * 6. Cloudflare Bot Management & Super Bot Fight Mode
 * 7. Origin Request Header Modification (Inject X-Origin-Verify secret)
 * 8. Edge Health Checks & Failover Monitoring (/api/health)
 * 9. Cloudflare Logpush Telemetry to Centralized SIEM
 * ==============================================================================
 */

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.20.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.15.0"
    }
  }
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID for the opexnal.com domain"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID"
}

variable "domain_name" {
  type        = string
  default     = "opexnal.com"
  description = "Primary production apex domain"
}

variable "origin_ip" {
  type        = string
  description = "Target origin server IP address or load balancer VIP"
}

variable "origin_verify_secret" {
  type        = string
  sensitive   = true
  description = "Cryptographically secure secret token injected by Cloudflare and verified by origin (ORIGIN_VERIFY_TOKEN)"
}

variable "enforce_origin_protection" {
  type        = bool
  default     = true
  description = "Whether to enforce strict origin header validation at the edge and origin"
}

variable "siem_destination_bucket" {
  type        = string
  default     = "gs://opexnal-security-siem-logs-prod"
  description = "GCS/S3 destination bucket for Cloudflare Logpush security audit logs"
}

# ------------------------------------------------------------------------------
# 1. DNS PROXYING (ANYCAST DDOS SHIELD)
# ------------------------------------------------------------------------------
resource "cloudflare_record" "apex_a" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = var.origin_ip
  type    = "A"
  ttl     = 1 # Automatic when proxied
  proxied = true
}

resource "cloudflare_record" "www_cname" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = var.domain_name
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

resource "cloudflare_record" "api_subdomain" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = var.domain_name
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

# ------------------------------------------------------------------------------
# 2. CLOUDFLARE ZONE SETTINGS (EDGE SSL, MINIMUM TLS 1.3, STRICT CIPHERS)
# ------------------------------------------------------------------------------
resource "cloudflare_zone_settings_override" "opexnal_edge_settings" {
  zone_id = var.cloudflare_zone_id

  settings {
    ssl                      = "strict"
    min_tls_version          = "1.3"
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    brotli                   = "on"
    http3                    = "on"
    zero_rtt                 = "off" # Mitigate replay attacks
    tls_1_3                  = "on"
    security_header {
      enabled            = true
      preload            = true
      max_age            = 31536000
      include_subdomains = true
      nosniff            = true
    }
  }
}

# ------------------------------------------------------------------------------
# 3. AUTHENTICATED ORIGIN PULLS (CLIENT CERTIFICATE FROM CLOUDFLARE TO ORIGIN)
# ------------------------------------------------------------------------------
resource "cloudflare_authenticated_origin_pulls" "opexnal_aop" {
  zone_id = var.cloudflare_zone_id
  enabled = true
}

# ------------------------------------------------------------------------------
# 4. HTTP DDOS ATTACK PROTECTION MANAGED RULESET OVERRIDE
# ------------------------------------------------------------------------------
resource "cloudflare_ruleset" "opexnal_ddos_override" {
  zone_id     = var.cloudflare_zone_id
  name        = "Opexnal Managed HTTP DDoS Mitigation Override"
  description = "Aggressive sensitivity for L7 HTTP flood attacks against Opexnal"
  kind        = "zone"
  phase       = "ddos_l7"

  rules {
    action = "execute"
    action_parameters {
      id = "4f2ffd5214264665a392b2164f9cb376" # Cloudflare Managed HTTP DDoS Ruleset ID
      overrides {
        sensitivity_level = "high"
        action            = "block"
      }
    }
    expression  = "true"
    description = "Enforce high-sensitivity adaptive HTTP DDoS mitigation"
    enabled     = true
  }
}

# ------------------------------------------------------------------------------
# 5. CLOUDFLARE CUSTOM WAF & BOT MITIGATION RULESET
# ------------------------------------------------------------------------------
resource "cloudflare_ruleset" "opexnal_edge_waf" {
  zone_id     = var.cloudflare_zone_id
  name        = "Opexnal Production Defense-in-Depth Edge WAF"
  description = "Block OWASP Top 10, scanners, and botnets at Cloudflare Anycast edge"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  # Rule 1: Block offensive security scanners
  rules {
    action      = "block"
    description = "Block automated vulnerability and fuzzing scanners"
    expression  = "(http.user_agent contains \"sqlmap\") or (http.user_agent contains \"nikto\") or (http.user_agent contains \"nuclei\") or (http.user_agent contains \"zgrab\") or (http.user_agent contains \"acunetix\")"
    enabled     = true
  }

  # Rule 2: Managed Challenge for high threat score or verified automated bots
  rules {
    action      = "interactive_challenge"
    description = "Managed Challenge for suspicious traffic and unverified bots"
    expression  = "(cf.threat_score gt 30) or (cf.client.bot and not cf.bot_management.verified_bot)"
    enabled     = true
  }

  # Rule 3: Enforce strict origin header if accessing origin directly
  rules {
    action      = "block"
    description = "Enforce secret origin header to prevent direct-to-origin IP bypass"
    expression  = "(not any(http.request.headers[\"x-origin-verify\"][*] eq \"${var.origin_verify_secret}\"))"
    enabled     = var.enforce_origin_protection
  }
}

# ------------------------------------------------------------------------------
# 6. ORIGIN REQUEST HEADER MODIFICATION (INJECT ORIGIN_VERIFY_TOKEN AT EDGE)
# ------------------------------------------------------------------------------
resource "cloudflare_ruleset" "opexnal_inject_origin_token" {
  zone_id     = var.cloudflare_zone_id
  name        = "Opexnal Origin Verification Header Injection"
  description = "Injects the trusted X-Origin-Verify secret header from Cloudflare edge to origin"
  kind        = "zone"
  phase       = "http_request_late_transform"

  rules {
    action = "rewrite"
    action_parameters {
      headers {
        name       = "X-Origin-Verify"
        operation  = "set"
        value      = var.origin_verify_secret
      }
    }
    expression  = "true"
    description = "Inject trusted origin verification token"
    enabled     = true
  }
}

# ------------------------------------------------------------------------------
# 7. RATE LIMITING AT THE EDGE (PREVENTS HTTP FLOOD BEFORE ORIGIN)
# ------------------------------------------------------------------------------
resource "cloudflare_ruleset" "opexnal_rate_limiting" {
  zone_id     = var.cloudflare_zone_id
  name        = "Opexnal Edge Rate Limiting"
  description = "Mitigate layer 7 HTTP flood attacks against Auth and AI endpoints"
  kind        = "zone"
  phase       = "http_ratelimit"

  # Auth gateway rate limit (15 requests per minute per IP)
  rules {
    action      = "block"
    description = "Rate limit authentication endpoints to prevent credential stuffing"
    expression  = "(http.request.uri.path eq \"/auth\") or (starts_with(http.request.uri.path, \"/api/auth\"))"
    enabled     = true

    ratelimit {
      characteristics     = ["cf.connecting_ip"]
      period              = 60
      requests_per_period = 15
      mitigation_timeout  = 300
    }
  }

  # AI Proxy rate limit (20 requests per minute per IP)
  rules {
    action      = "block"
    description = "Rate limit AI proxy endpoints to prevent denial-of-wallet"
    expression  = "starts_with(http.request.uri.path, \"/api/ai/\")"
    enabled     = true

    ratelimit {
      characteristics     = ["cf.connecting_ip"]
      period              = 60
      requests_per_period = 20
      mitigation_timeout  = 180
    }
  }
}

# ------------------------------------------------------------------------------
# 8. CLOUDFLARE HEALTH CHECK & FAILOVER MONITORING
# ------------------------------------------------------------------------------
resource "cloudflare_healthcheck" "opexnal_origin_healthcheck" {
  zone_id          = var.cloudflare_zone_id
  name             = "opexnal-origin-health"
  description      = "Monitors Opexnal Origin health check endpoint"
  address          = var.domain_name
  type             = "HTTPS"
  port             = 443
  method           = "GET"
  path             = "/api/health"
  expected_codes   = ["200"]
  interval         = 60
  retries          = 2
  timeout          = 5
  consecutive_fails     = 3
  consecutive_successes = 2
  check_regions    = ["WNAM", "ENAM", "WEU", "EEU", "SEAS"]
}

# ------------------------------------------------------------------------------
# 9. CLOUDFLARE LOGPUSH (SIEM AUDIT LOGGING)
# ------------------------------------------------------------------------------
resource "cloudflare_logpush_job" "http_requests_siem" {
  zone_id          = var.cloudflare_zone_id
  name             = "opexnal-edge-http-requests-siem"
  logstream        = true
  destination_conf = "${var.siem_destination_bucket}/edge-logs?header_x-amz-server-side-encryption=AES256"
  dataset          = "http_requests"
  enabled          = true
  filter           = "{\"where\":{\"and\":[{\"key\":\"EdgeResponseStatus\",\"operator\":\"in\",\"value\":[400,401,403,429,500,502,503]}]}}"
}

# ------------------------------------------------------------------------------
# 10. GOOGLE CLOUD ARMOR POLICY (ALTERNATIVE GCP EDGE CONTROLS)
# ------------------------------------------------------------------------------
resource "google_compute_security_policy" "opexnal_cloud_armor" {
  name        = "opexnal-cloud-armor-waf"
  description = "Google Cloud Armor Edge Security Policy for Opexnal Services"

  # Block OWASP SQLi
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block OWASP ModSecurity Core Rule Set SQL Injection"
  }

  # Block OWASP XSS
  rule {
    action   = "deny(403)"
    priority = "1001"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block OWASP ModSecurity Core Rule Set XSS"
  }

  # Block Remote Code Execution & Local File Inclusion
  rule {
    action   = "deny(403)"
    priority = "1002"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-v33-stable') || evaluatePreconfiguredExpr('rce-v33-stable')"
      }
    }
    description = "Block LFI and RCE attack vectors"
  }

  # Default allow for clean traffic
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }
}
