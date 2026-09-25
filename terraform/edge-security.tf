/**
 * ==============================================================================
 * OPEXNAL GLOBAL EDGE SECURITY & DDOS MITIGATION INFRASTRUCTURE (TERRAFORM)
 * Provider Configuration Specification: Cloudflare & Google Cloud Armor
 *
 * STATUS: PROVIDER CONFIGURATION REQUIRED
 * This configuration defines the edge perimeter, WAF ruleset, rate limiting,
 * SSL/TLS strict mode, and origin protection shielding for Opexnal.
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

# ------------------------------------------------------------------------------
# 1. CLOUDFLARE ZONE SETTINGS (EDGE SSL, MINIMUM TLS 1.3, STRICT CIPHERS)
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
# 2. CLOUDFLARE WAF & BOT MITIGATION RULESET
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
    expression  = "(http.user_agent contains \"sqlmap\") or (http.user_agent contains \"nikto\") or (http.user_agent contains \"nuclei\") or (http.user_agent contains \"zgrab\")"
    enabled     = true
  }

  # Rule 2: Challenge known threat scores
  rules {
    action      = "interactive_challenge"
    description = "Managed Challenge for high Cloudflare threat score IP addresses"
    expression  = "(cf.threat_score gt 40) or (cf.client.bot)"
    enabled     = true
  }

  # Rule 3: Enforce Origin Protection Secret
  rules {
    action      = "block"
    description = "Enforce secret origin header to prevent direct-to-origin IP bypass"
    expression  = "(not any(http.request.headers[\"x-origin-verify\"][*] eq \"${var.origin_verify_secret}\"))"
    enabled     = var.enforce_origin_protection
  }
}

# ------------------------------------------------------------------------------
# 3. RATE LIMITING AT THE EDGE (PREVENTS HTTP FLOOD BEFORE ORIGIN)
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
# 4. GOOGLE CLOUD ARMOR POLICY (ALTERNATIVE GCP EDGE CONTROLS)
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
