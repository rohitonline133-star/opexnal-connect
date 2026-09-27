/**
 * OPEX AI Safety & Defense Engine
 *
 * Implements defense-in-depth protections:
 * - Prompt injection and jailbreak interception
 * - Secret / credential leakage prevention
 * - PII and sensitive token redactor
 * - Input & output boundaries
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+override/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /what\s+is\s+your\s+system\s+prompt/i,
  /dump\s+system\s+prompt/i,
  /act\s+as\s+dan/i,
  /jailbreak/i,
  /disable\s+(all\s+)?safety\s+filters/i,
  /bypass\s+(all\s+)?content\s+filters/i,
  /roleplay\s+as\s+an\s+unfiltered\s+ai/i,
];

const SECRET_PATTERNS = [
  /Bearer\s+[a-zA-Z0-9_.-]{20,}/gi,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, // JWT
  /(AIza|sb_publishable_|sb_secret_|sk-)[a-zA-Z0-9_-]{20,}/g,
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g, // Base64 tokens
  /(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{6,}["']?/gi,
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // Credit card numbers
];

export interface SafetyCheckResult {
  allowed: boolean;
  sanitizedText: string;
  reason?: string;
  threatLevel: "none" | "low" | "medium" | "high";
}

export class SafetyEngine {
  /**
   * Scans input prompt for jailbreaks and prompt injections.
   */
  public static checkInput(prompt: string): SafetyCheckResult {
    if (!prompt || typeof prompt !== "string") {
      return { allowed: true, sanitizedText: "", threatLevel: "none" };
    }

    // 1. Length constraint check
    if (prompt.length > 32000) {
      return {
        allowed: false,
        sanitizedText: prompt.slice(0, 32000),
        reason: "Input exceeds maximum character boundary (32,000 characters).",
        threatLevel: "medium",
      };
    }

    // 2. Check for malicious prompt injection patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(prompt)) {
        return {
          allowed: false,
          sanitizedText: "[BLOCKED: Prompt injection / system override attempted]",
          reason: "Detected unauthorized attempt to bypass platform system instructions.",
          threatLevel: "high",
        };
      }
    }

    // 3. Sanitize and redact any embedded secrets/PII
    const sanitized = this.redactSecrets(prompt);

    return {
      allowed: true,
      sanitizedText: sanitized,
      threatLevel: "none",
    };
  }

  /**
   * Sanitizes output from model before returning to user.
   */
  public static checkOutput(response: string): string {
    if (!response) return "";
    return this.redactSecrets(response);
  }

  /**
   * Redacts tokens, passwords, bearer headers and keys.
   */
  public static redactSecrets(text: string): string {
    let result = text;
    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(pattern, "[REDACTED_SENSITIVE_DATA]");
    }
    return result;
  }
}
