import type { SecurityRiskAssessment } from "./types";
import { getSecurityEvents } from "./audit-logger";

export function evaluateRequestRisk(params: {
  ip: string;
  fingerprint: string;
  userId?: string | undefined;
  path: string;
  method: string;
  userAgent?: string | undefined;
}): SecurityRiskAssessment {
  const { ip, fingerprint, userId, path, method, userAgent } = params;
  let score = 0;
  const factors: string[] = [];

  // 1. User-Agent Signals
  if (!userAgent || userAgent.trim() === "") {
    score += 25;
    factors.push("Missing or empty User-Agent header");
  } else if (/sqlmap|nikto|nmap|masscan|zgrab|gobuster/i.test(userAgent)) {
    score += 35;
    factors.push(`Exploit/vulnerability scanner User-Agent detected (${userAgent})`);
  } else if (/curl|python|wget|postman|insomnia|go-http-client|axios/i.test(userAgent)) {
    score += 20;
    factors.push(`Automated script/client User-Agent detected (${userAgent})`);
  }

  // 2. Sensitive Action Context
  const isSensitiveAction =
    path.includes("/settings/security") ||
    path.includes("/payout") ||
    path.includes("/password") ||
    path.includes("/2fa") ||
    (path.includes("/profile") && method === "PATCH");

  if (isSensitiveAction) {
    score += 15;
    factors.push("Accessing sensitive security or financial endpoint");
  }

  // 3. Historical Anomaly / Recent Threat Failures
  const recentEvents = getSecurityEvents({ limit: 100 });
  const recentIpViolations = recentEvents.filter(
    (e) =>
      e.ip === ip &&
      (e.actionTaken === "RATE_LIMITED" ||
        e.actionTaken === "BLOCKED_WAF" ||
        e.eventType.includes("FAILED")),
  );

  if (recentIpViolations.length >= 3) {
    score += 35;
    factors.push(`IP has ${recentIpViolations.length} recent security violations`);
  } else if (recentIpViolations.length > 0) {
    score += 15;
    factors.push(`IP has previous security event in recent window`);
  }

  // 4. Device Fingerprint Anomaly
  if (fingerprint === "unknown") {
    score += 10;
    factors.push("Unable to verify client device fingerprint");
  }

  // Normalized score max 100
  score = Math.min(100, Math.max(0, score));

  let action: SecurityRiskAssessment["action"] = "ALLOW";
  let requiresMfa = false;
  let isBlocked = false;

  if (score >= 90) {
    action = "ACCOUNT_QUARANTINED";
    isBlocked = true;
  } else if (score >= 75) {
    action = "BLOCKED_WAF";
    isBlocked = true;
  } else if (score >= 40) {
    action = "CHALLENGE_REQUIRED";
    requiresMfa = true;
  }

  return {
    score,
    factors,
    action,
    requiresMfa,
    isBlocked,
  };
}
