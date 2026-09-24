import { logSecurityEvent } from "./audit-logger";

export interface WafInspectionResult {
  blocked: boolean;
  statusCode?: number;
  reason?: string;
  category?:
    "SQLI" | "XSS" | "PATH_TRAVERSAL" | "MALICIOUS_SCANNER" | "COMMAND_INJECTION" | "PROBE";
}

// Common malicious probe targets
const PROBE_PATHS = [
  /\.env(\.|$)/i,
  /\.git(\/|$)/i,
  /\.aws(\/|$)/i,
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/phpmyadmin/i,
  /\/actuator/i,
  /\/console(\/|$)/i,
  /\/eval-stdin/i,
  /\/server-status/i,
  /\/debug\/default\/view/i,
  /\/boaform/i,
];

// Malicious User-Agent signatures (penetration scanners, brute-force bots)
const SUSPICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /zgrab/i,
  /gobuster/i,
  /dirbuster/i,
  /acunetix/i,
  /havij/i,
  /wpscan/i,
];

// Attack pattern regular expressions
const ATTACK_PATTERNS = {
  SQLI: [
    /(%27)|(')|(--)|(%23)|(#)/i,
    /\b(select\s+.+\s+from|insert\s+into|delete\s+from|drop\s+table|update\s+.+\s+set)\b/i,
    /\b(union(\s+all)?\s+select)\b/i,
    /\b(or\s+1\s*=\s*1|or\s+'1'\s*=\s*'1')\b/i,
    /\b(sleep\s*\(\s*\d+\s*\)|pg_sleep\s*\(\s*\d+\s*\))\b/i,
    /\b(information_schema|sys\.tables|pg_catalog)\b/i,
  ],
  XSS: [
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /<[\s\S]*?\bon\w+\s*=[\s\S]*?>/i, // onload, onerror, onclick, etc.
    /javascript\s*:/i,
    /data\s*:\s*text\/html/i,
    /<iframe[\s\S]*?>/i,
  ],
  PATH_TRAVERSAL: [/(\.\.[/\\])+/, /%2e%2e[/\\]/i, /\/etc\/passwd/i, /\/windows\/win\.ini/i],
  COMMAND_INJECTION: [
    /(\||&|;|\$\(|`)\s*(cat|ls|whoami|id|nc|bash|sh|curl|wget|cmd\.exe|powershell)\b/i,
    /\$\{jndi:(ldap|rmi|dns):/i, // Log4j / JNDI injection
  ],
};

/**
 * Inspects incoming HTTP requests for signature-based and behavioral threats
 */
export function inspectRequestWithWaf(params: {
  url: URL;
  method: string;
  headers: Headers;
  rawBody?: string;
  ip: string;
  fingerprint: string;
}): WafInspectionResult {
  const { url, headers, rawBody, ip, fingerprint } = params;
  const pathname = url.pathname;
  const search = url.search;
  const userAgent = headers.get("user-agent") || "";

  // 1. Check for known scanner / automated exploit User-Agents
  for (const botPattern of SUSPICIOUS_USER_AGENTS) {
    if (botPattern.test(userAgent)) {
      logSecurityEvent({
        severity: "HIGH",
        eventType: "WAF_SCANNER_BLOCKED",
        actionTaken: "BLOCKED_WAF",
        ip,
        fingerprint,
        path: pathname,
        method: params.method,
        details: { userAgent, matchedPattern: botPattern.source },
        riskScore: 90,
      });
      return {
        blocked: true,
        statusCode: 403,
        reason: "Access forbidden by security rule (suspicious client signature)",
        category: "MALICIOUS_SCANNER",
      };
    }
  }

  // 2. Check for unauthorized environment and backdoor probes
  for (const probePattern of PROBE_PATHS) {
    if (probePattern.test(pathname)) {
      logSecurityEvent({
        severity: "HIGH",
        eventType: "WAF_PROBE_BLOCKED",
        actionTaken: "BLOCKED_WAF",
        ip,
        fingerprint,
        path: pathname,
        method: params.method,
        details: { pathname, matchedPattern: probePattern.source },
        riskScore: 95,
      });
      return {
        blocked: true,
        statusCode: 404,
        reason: "Not Found",
        category: "PROBE",
      };
    }
  }

  // Helper string to check query and body
  const payloadToCheck = decodeURIComponentSafe(`${pathname} ${search} ${rawBody || ""}`);

  // 3. Path traversal inspection
  for (const pattern of ATTACK_PATTERNS.PATH_TRAVERSAL) {
    if (pattern.test(pathname) || pattern.test(search)) {
      logSecurityEvent({
        severity: "CRITICAL",
        eventType: "WAF_PATH_TRAVERSAL_BLOCKED",
        actionTaken: "BLOCKED_WAF",
        ip,
        fingerprint,
        path: pathname,
        method: params.method,
        details: { pattern: pattern.source },
        riskScore: 95,
      });
      return {
        blocked: true,
        statusCode: 400,
        reason: "Suspicious path sequence detected",
        category: "PATH_TRAVERSAL",
      };
    }
  }

  // 4. Command Injection / JNDI inspection
  for (const pattern of ATTACK_PATTERNS.COMMAND_INJECTION) {
    if (pattern.test(payloadToCheck)) {
      logSecurityEvent({
        severity: "CRITICAL",
        eventType: "WAF_COMMAND_INJECTION_BLOCKED",
        actionTaken: "BLOCKED_WAF",
        ip,
        fingerprint,
        path: pathname,
        method: params.method,
        details: { pattern: pattern.source },
        riskScore: 100,
      });
      return {
        blocked: true,
        statusCode: 400,
        reason: "Malicious payload detected by application firewall",
        category: "COMMAND_INJECTION",
      };
    }
  }

  // 5. Explicit XSS patterns in query parameters or payload
  for (const pattern of ATTACK_PATTERNS.XSS) {
    if (pattern.test(payloadToCheck)) {
      logSecurityEvent({
        severity: "HIGH",
        eventType: "WAF_XSS_BLOCKED",
        actionTaken: "BLOCKED_WAF",
        ip,
        fingerprint,
        path: pathname,
        method: params.method,
        details: { pattern: pattern.source },
        riskScore: 85,
      });
      return {
        blocked: true,
        statusCode: 400,
        reason: "Dangerous script content rejected",
        category: "XSS",
      };
    }
  }

  // 6. SQL Injection patterns in query parameters and body
  for (const pattern of ATTACK_PATTERNS.SQLI) {
    if (pattern.test(payloadToCheck)) {
      logSecurityEvent({
        severity: "CRITICAL",
        eventType: "WAF_SQLI_BLOCKED",
        actionTaken: "BLOCKED_WAF",
        ip,
        fingerprint,
        path: pathname,
        method: params.method,
        details: { pattern: pattern.source },
        riskScore: 95,
      });
      return {
        blocked: true,
        statusCode: 400,
        reason: "Malformed query structure rejected",
        category: "SQLI",
      };
    }
  }

  return { blocked: false };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function decodeURIComponentSafe(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}
