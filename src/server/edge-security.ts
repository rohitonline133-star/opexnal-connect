/**
 * Opexnal Defense-in-Depth: Global Edge Security & WAF Engine
 *
 * Provides:
 * - Malicious Payload Filtering (SQLi, XSS, Path Traversal, Proto Pollution, SSRF/Metadata)
 * - Anti-Scanner & Automated Bot Filtering (SQLMap, Nikto, Nuclei, ZGrab, etc.)
 * - Origin Protection (X-Origin-Verify token inspection with constant-time equality)
 * - Multi-Tier Sliding Window Rate Limiting (Auth, AI, API, Static)
 * - Cloudflare / AWS Shield / Google Cloud Armor Edge Integration Layer
 * - Security Header Enforcement (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
 *
 * PROVIDER CONFIGURATION REQUIRED:
 * Upstream CDN/Edge DDoS mitigation, Anycast DNS routing, and managed Cloud Armor / Cloudflare
 * edge WAF rules must be provisioned at the cloud provider boundary (see terraform/edge-security.tf).
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { checkRateLimit } from "../lib/security";

export interface EdgeSecurityConfig {
  originVerificationToken?: string;
  enableStrictOriginCheck?: boolean;
  enableSsrWaf?: boolean;
}

export interface WafInspectionResult {
  blocked: boolean;
  status: number;
  reason?: string;
  attackCategory?:
    | "SQL_INJECTION"
    | "XSS"
    | "PATH_TRAVERSAL"
    | "SSRF_METADATA"
    | "PROTOTYPE_POLLUTION"
    | "MALICIOUS_SCANNER"
    | "ORIGIN_UNVERIFIED"
    | "RATE_LIMITED";
  clientIp: string;
}

// 1. MALICIOUS REGEX PATTERNS FOR REAL-TIME WAF INSPECTION
const SQL_INJECTION_PATTERNS = [
  /(\b(UNION([\s\S]*?)SELECT|SELECT([\s\S]*?)FROM|INSERT([\s\S]*?)INTO|UPDATE([\s\S]*?)SET|DELETE([\s\S]*?)FROM|DROP([\s\S]*?)TABLE|ALTER([\s\S]*?)TABLE)\b)/i,
  /(('|")\s*(OR|AND)\s*('|"|[0-9])+\s*=\s*('|"|[0-9])+)/i,
  /(WAITFOR\s+DELAY\s+'[0-9:]+'|BENCHMARK\s*\([0-9]+,[\s\S]*\)|SLEEP\s*\([0-9]+\))/i,
  /(--[\s\S]*$|\/\*[\s\S]*?\*\/|;\s*SHUTDOWN|;\s*EXEC)/i,
];

const XSS_PATTERNS = [
  /<[\s/]*(script|iframe|object|embed|applet|meta|link|svg|math|form)[^>]*>/i,
  /(javascript|vbscript|data):[\s\S]*?(alert|eval|document|cookie|window|location)/i,
  /\bon\w+\s*=\s*["']?[^"'>\s]+/i, // e.g. onerror=, onload=, onclick=
  /(alert\s*\(|confirm\s*\(|prompt\s*\(|<img\s+src=x\s+onerror=)/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.[/\\]|\.\.%2f|\.\.%5c|%2e%2e[/\\])/i,
  /(\/etc\/passwd|\/etc\/shadow|\/proc\/self|\/windows\/win\.ini|\/windows\/system32)/i,
  /(\.\.\/\.\.\/)/,
];

const PROTOTYPE_POLLUTION_PATTERNS = [
  /(__proto__|constructor\.prototype|prototype\[|Object\.assign\s*\(\s*Object\.prototype)/i,
];

const SSRF_METADATA_PATTERNS = [
  /(169\.254\.169\.254|metadata\.google\.internal|metadata\.aws|100\.100\.100\.200)/i,
  /(http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)[/:?])/i,
];

const SCANNER_USER_AGENTS = [
  "sqlmap",
  "nikto",
  "nuclei",
  "zgrab",
  "masscan",
  "dirbuster",
  "gobuster",
  "wpscan",
  "acunetix",
  "nessus",
  "openvas",
  "nmap",
];

// RFC1918 / Bogon private IPs (for checking public edge access)
const BOGON_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
];

/**
 * Extracts client IP with header precedence (Cloudflare CF-Connecting-IP > True-Client-IP > X-Forwarded-For).
 */
export function extractClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const trueClientIp = request.headers.get("true-client-ip");
  if (trueClientIp) return trueClientIp.trim();

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const firstIp = xff.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "127.0.0.1";
}

/**
 * Checks whether an IP belongs to private / loopback / bogon ranges.
 */
export function isBogonOrPrivateIp(ip: string): boolean {
  return BOGON_IP_RANGES.some((regex) => regex.test(ip));
}

/**
 * Inspects a request URI, headers, and query parameters against WAF signatures.
 */
export function inspectRequestWaf(request: Request): WafInspectionResult {
  const clientIp = extractClientIp(request);
  const userAgent = request.headers.get("user-agent") || "";
  const uaLower = userAgent.toLowerCase();

  // 1. Malicious Vulnerability Scanner & Recon tool detection
  for (const scanner of SCANNER_USER_AGENTS) {
    if (uaLower.includes(scanner)) {
      return {
        blocked: true,
        status: 403,
        reason: `Automated vulnerability scanner rejected: ${scanner}`,
        attackCategory: "MALICIOUS_SCANNER",
        clientIp,
      };
    }
  }

  // 2. Decode and inspect URL, Pathname, and Query String
  let decodedUrl = "";
  try {
    decodedUrl = decodeURIComponent(request.url);
  } catch {
    // Malformed URI encoding is often an evasion attempt
    return {
      blocked: true,
      status: 400,
      reason: "Malformed URI encoding rejected",
      attackCategory: "PATH_TRAVERSAL",
      clientIp,
    };
  }

  const urlLower = decodedUrl.toLowerCase();

  // Check SSRF & Cloud Metadata targeting
  for (const pattern of SSRF_METADATA_PATTERNS) {
    if (pattern.test(urlLower)) {
      return {
        blocked: true,
        status: 403,
        reason: "Access to internal cloud metadata or local loopback blocked (SSRF Protection)",
        attackCategory: "SSRF_METADATA",
        clientIp,
      };
    }
  }

  // Check Path Traversal
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(decodedUrl)) {
      return {
        blocked: true,
        status: 400,
        reason: "Directory traversal attack pattern blocked",
        attackCategory: "PATH_TRAVERSAL",
        clientIp,
      };
    }
  }

  // Check SQL Injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(decodedUrl)) {
      return {
        blocked: true,
        status: 400,
        reason: "SQL injection payload detected in query string",
        attackCategory: "SQL_INJECTION",
        clientIp,
      };
    }
  }

  // Check Cross-Site Scripting (XSS)
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(decodedUrl)) {
      return {
        blocked: true,
        status: 400,
        reason: "Cross-site scripting (XSS) payload detected in request URL",
        attackCategory: "XSS",
        clientIp,
      };
    }
  }

  // Check Prototype Pollution
  for (const pattern of PROTOTYPE_POLLUTION_PATTERNS) {
    if (pattern.test(decodedUrl)) {
      return {
        blocked: true,
        status: 400,
        reason: "Prototype pollution pattern blocked",
        attackCategory: "PROTOTYPE_POLLUTION",
        clientIp,
      };
    }
  }

  return { blocked: false, status: 200, clientIp };
}

/**
 * Constant-time string equality check to prevent timing side-channel attacks on secret tokens.
 * Pre-hashes inputs with SHA-256 to ensure identical 32-byte buffer lengths.
 */
export function safeTimingEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/**
 * Validates Origin Protection to ensure requests reach origin solely via authorized edge/CDN proxy.
 *
 * FAIL-CLOSED BEHAVIOR:
 * When strict mode is enabled (e.g. in production, or when strictOrigin is explicitly set),
 * if expectedSecret is undefined or empty, it FAILS CLOSED rather than bypassing, preventing
 * accidental exposure of origin servers in production deployments.
 */
export function verifyOriginSecret(
  request: Request,
  expectedSecret?: string,
  options?: { strictMode?: boolean },
): { valid: boolean; reason?: string } {
  const isStrict =
    options?.strictMode ??
    (process.env["NODE_ENV"] === "production" || process.env["OPEXNAL_STRICT_ORIGIN"] === "true");

  // Fail closed if strict mode is active but the origin secret is unconfigured
  if (!expectedSecret || expectedSecret.trim() === "") {
    if (isStrict) {
      return {
        valid: false,
        reason:
          "Fail-closed: Strict origin protection enforced but ORIGIN_VERIFY_TOKEN is unconfigured.",
      };
    }
    // Allow pass-through in non-production local development if unconfigured
    return { valid: true };
  }

  const providedSecret =
    request.headers.get("x-origin-verify") || request.headers.get("cf-access-client-id") || "";

  if (!providedSecret || !safeTimingEqual(providedSecret, expectedSecret)) {
    return {
      valid: false,
      reason: "Direct origin access prohibited. Traffic must route through approved CDN edge.",
    };
  }

  return { valid: true };
}

/**
 * Enforces multi-tier rate limits based on endpoint classification:
 * - Auth Tier (/auth, /api/auth): 15 req/min
 * - AI Tier (/api/ai/*): 20 req/min
 * - Security Tier (/api/security/*): 30 req/min
 * - Static/App Tier: 300 req/min
 */
export function checkEdgeTierRateLimit(
  request: Request,
  clientIp: string,
): { allowed: boolean; retryAfterSec: number; tier: string } {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();

  let maxLimit = 300;
  let tier = "STATIC_SSR";

  if (path === "/auth" || path.startsWith("/api/auth")) {
    maxLimit = 15;
    tier = "AUTH_GATEWAY";
  } else if (path.startsWith("/api/ai/")) {
    maxLimit = 20;
    tier = "AI_INFERENCE";
  } else if (path.startsWith("/api/security/")) {
    maxLimit = 30;
    tier = "SECURITY_MANAGEMENT";
  } else if (path.startsWith("/api/")) {
    maxLimit = 60;
    tier = "GENERAL_API";
  }

  const result = checkRateLimit(`edge_tier:${tier}:${clientIp}`, maxLimit, 60_000);
  return {
    allowed: result.allowed,
    retryAfterSec: result.retryAfterSec,
    tier,
  };
}

/**
 * Applies strict production headers to HTTP response.
 */
export function applyEdgeSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Content-Security-Policy
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; media-src 'self' blob: https:; frame-ancestors 'self'; object-src 'none'; base-uri 'self';",
  );

  // Prevent MIME type sniffing
  headers.set("X-Content-Type-Options", "nosniff");

  // Clickjacking defense
  headers.set("X-Frame-Options", "SAMEORIGIN");

  // Strict Referrer
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Modern Hardware & Permissions Policy
  headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(), payment=()");

  // HSTS (1 year + subdomains + preload)
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Legacy XSS filter fallback
  headers.set("X-XSS-Protection", "1; mode=block");

  // Anti-cache on API responses
  const contentType = headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    headers.set("Pragma", "no-cache");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
