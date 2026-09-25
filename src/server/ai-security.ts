/**
 * Opexnal Defense-in-Depth: AI Security & Prompt Injection Defense
 *
 * Protects server-side LLM inference against:
 * - Direct Prompt Injections ("Ignore previous instructions", "Forget system directives")
 * - Jailbreaks (DAN, "Developer Mode", "Uncensored assistant roleplay")
 * - System Prompt Extraction ("Output your initial prompt verbatim")
 * - Delimiter Injections ("--- END SYSTEM INSTRUCTION ---", "[INST] <<SYS>>")
 * - Denial-of-Wallet & Excessive token abuse
 */

export interface PromptSecurityCheckResult {
  safe: boolean;
  violation?: string;
  riskScore: number;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directives|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|directives)/i,
  /forget\s+(your\s+)?(rules|instructions|programming|constraints)/i,
  /\byou\s+are\s+now\s+(dan|unfiltered|jailbroken|godmode|root)\b/i,
  /\bdo\s+anything\s+now\b/i,
  /\bdeveloper\s+mode\s+(enabled|on)\b/i,
  /\b(reveal|output|print|show)\s+(your\s+)?(system\s+prompt|initial\s+instructions|base\s+prompt)\b/i,
  /(---|\*\*\*)\s*(begin|start|end)\s*(system|instruction|prompt)/i,
  /\[INST\]\s*<<SYS>>/i,
  /<\|im_start\|>system/i,
];

/**
 * Evaluates whether an input prompt contains prompt injection or jailbreak attempts.
 */
export function inspectPromptSecurity(prompt: string): PromptSecurityCheckResult {
  if (!prompt || typeof prompt !== "string") {
    return { safe: true, riskScore: 0 };
  }

  const trimmed = prompt.trim();

  // Excessive length check (Denial-of-Wallet protection)
  if (trimmed.length > 4000) {
    return {
      safe: false,
      violation: "Prompt length exceeds 4,000 character maximum safety threshold",
      riskScore: 70,
    };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        safe: false,
        violation: "Prompt injection or system override pattern detected",
        riskScore: 90,
      };
    }
  }

  return { safe: true, riskScore: 0 };
}
