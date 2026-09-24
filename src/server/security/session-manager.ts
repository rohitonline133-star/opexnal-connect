import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { ActiveUserSession, ReauthProof } from "./types";
import { logSecurityEvent } from "./audit-logger";

// In-memory session store (production-ready interface, compatible with Redis/Memcached)
const activeSessions = new Map<string, ActiveUserSession>();
const userSessionIndex = new Map<string, Set<string>>(); // userId -> Set<sessionId>
const quarantinedAccounts = new Map<string, { reason: string; until: number }>();

const REAUTH_SECRET =
  process.env["REAUTH_SECRET"] ||
  (process.env["NODE_ENV"] === "production"
    ? (() => {
        throw new Error(
          "[SECURITY CRITICAL] Mandatory REAUTH_SECRET is missing in production environment",
        );
      })()
    : "opexnal-sec-reauth-key-change-in-prod");

/**
 * Computes a deterministic device fingerprint from request headers
 */
export function computeDeviceFingerprint(headers: Headers, ip: string): string {
  const userAgent = headers.get("user-agent") || "unknown-ua";
  const acceptLanguage = headers.get("accept-language") || "unknown-lang";
  const clientDeviceHeader = headers.get("x-device-fingerprint") || "";

  // Combine headers to form a robust fingerprint resistant to simple IP hopping
  const raw = `${clientDeviceHeader}|${userAgent}|${acceptLanguage.split(",")[0]}`;
  return createHmac("sha256", "fingerprint-salt").update(raw).digest("hex").slice(0, 24);
}

/**
 * Registers or updates an active session on the server
 */
export function recordSessionActivity(params: {
  sessionId: string;
  userId: string;
  userAgent: string;
  ip: string;
  fingerprint: string;
}): ActiveUserSession {
  const { sessionId, userId, userAgent, ip, fingerprint } = params;
  const now = new Date().toISOString();

  let session = activeSessions.get(sessionId);
  if (!session) {
    session = {
      sessionId,
      userId,
      deviceFingerprint: fingerprint,
      userAgent,
      ip,
      locationEstimate: "Verified Location",
      createdAt: now,
      lastActiveAt: now,
      isRevoked: false,
    };
    activeSessions.set(sessionId, session);

    let userSessions = userSessionIndex.get(userId);
    if (!userSessions) {
      userSessions = new Set<string>();
      userSessionIndex.set(userId, userSessions);
    }
    userSessions.add(sessionId);
  } else {
    session.lastActiveAt = now;
    session.ip = ip;
  }

  return session;
}

/**
 * Validates if a session is currently allowed to make requests
 */
export function validateSessionStatus(
  sessionId: string,
  userId: string,
): { valid: boolean; reason?: string } {
  // Check if account is in containment / quarantine
  const quarantine = quarantinedAccounts.get(userId);
  if (quarantine && quarantine.until > Date.now()) {
    return {
      valid: false,
      reason: `Account placed in temporary security containment: ${quarantine.reason}`,
    };
  }

  const session = activeSessions.get(sessionId);
  if (!session) {
    // Session not found in registry (e.g., server restart or expired)
    return { valid: true };
  }

  if (session.isRevoked) {
    return {
      valid: false,
      reason: session.revocationReason || "Session has been explicitly terminated",
    };
  }

  return { valid: true };
}

/**
 * Revokes a specific session
 */
export function revokeSession(
  sessionId: string,
  reason = "User initiated logout / session termination",
): boolean {
  const existingSession = activeSessions.get(sessionId);
  if (!existingSession) {
    const newSession: ActiveUserSession = {
      sessionId,
      userId: "unknown",
      userAgent: "unknown",
      ip: "127.0.0.1",
      deviceFingerprint: "unknown",
      deviceType: "desktop",
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isRevoked: true,
      revocationReason: reason,
    };
    activeSessions.set(sessionId, newSession);
    return true;
  }

  existingSession.isRevoked = true;
  existingSession.revocationReason = reason;

  logSecurityEvent({
    severity: "MEDIUM",
    eventType: "SESSION_TERMINATED",
    actionTaken: "SESSION_REVOKED",
    userId: existingSession.userId,
    ip: existingSession.ip,
    fingerprint: existingSession.deviceFingerprint,
    path: "/api/security/revoke-session",
    method: "POST",
    details: { sessionId, reason },
    riskScore: 30,
  });

  return true;
}

/**
 * Revokes all sessions for a user EXCEPT the current one
 */
export function revokeAllOtherSessions(userId: string, currentSessionId: string): number {
  const sessions = userSessionIndex.get(userId);
  if (!sessions) return 0;

  let revokedCount = 0;
  for (const sid of sessions) {
    if (sid !== currentSessionId) {
      const s = activeSessions.get(sid);
      if (s && !s.isRevoked) {
        s.isRevoked = true;
        s.revocationReason = "User requested global signout of all other devices";
        revokedCount++;
      }
    }
  }

  logSecurityEvent({
    severity: "HIGH",
    eventType: "ALL_OTHER_SESSIONS_REVOKED",
    actionTaken: "SESSION_REVOKED",
    userId,
    ip: "server",
    fingerprint: "server",
    path: "/api/security/sessions/revoke-others",
    method: "POST",
    details: { revokedCount, currentSessionId },
    riskScore: 40,
  });

  return revokedCount;
}

/**
 * Security containment: Immediately quarantines account and kills all sessions
 */
export function engageEmergencyContainment(
  userId: string,
  reason: string,
  durationMinutes = 60,
): void {
  const until = Date.now() + durationMinutes * 60 * 1000;
  quarantinedAccounts.set(userId, { reason, until });

  const sessions = userSessionIndex.get(userId);
  if (sessions) {
    for (const sid of sessions) {
      const s = activeSessions.get(sid);
      if (s) {
        s.isRevoked = true;
        s.revocationReason = `Security Containment: ${reason}`;
      }
    }
  }

  logSecurityEvent({
    severity: "CRITICAL",
    eventType: "ACCOUNT_CONTAINMENT_ENGAGED",
    actionTaken: "ACCOUNT_QUARANTINED",
    userId,
    ip: "system",
    fingerprint: "system",
    path: "containment",
    method: "ALERT",
    details: { reason, durationMinutes, until: new Date(until).toISOString() },
    riskScore: 98,
  });
}

/**
 * Checks if an account is currently under emergency containment
 */
export function isAccountContained(userId: string): { isContained: boolean; reason?: string } {
  const q = quarantinedAccounts.get(userId);
  if (!q) return { isContained: false };
  if (Date.now() > q.until) {
    quarantinedAccounts.delete(userId);
    return { isContained: false };
  }
  return { isContained: true, reason: q.reason };
}

/**
 * Trigger emergency containment adapter
 */
export function triggerEmergencyContainment(params: {
  userId: string;
  reason: string;
  severity?: string;
}): void {
  engageEmergencyContainment(params.userId, params.reason, 120);
}

/**
 * Retrieves list of active sessions for a user
 */
export function getUserSessions(userId: string, currentSessionId?: string): ActiveUserSession[] {
  const sessionIds = userSessionIndex.get(userId);
  if (!sessionIds) return [];

  const results: ActiveUserSession[] = [];
  for (const sid of sessionIds) {
    const s = activeSessions.get(sid);
    if (s && !s.isRevoked) {
      results.push({
        ...s,
        isCurrent: s.sessionId === currentSessionId,
      });
    }
  }
  return results.sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime(),
  );
}

/**
 * Signs a step-up reauthentication proof token (valid for 10 minutes)
 */
export function issueReauthProof(userId: string, scope = "sensitive_operation"): string {
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const payload = `${userId}:${expiresAt}:${scope}`;
  const sig = createHmac("sha256", REAUTH_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/**
 * Verifies a step-up reauthentication token
 */
export function verifyReauthProof(
  token: string,
  requiredUserId: string,
  requiredScope?: string,
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [rawPayloadB64, sig] = parts;
  if (!rawPayloadB64 || !sig) return false;

  try {
    const payload = Buffer.from(rawPayloadB64, "base64url").toString("utf8");
    const [userId, expiresStr, scope] = payload.split(":");

    if (userId !== requiredUserId) return false;
    const expiresAt = Number(expiresStr);
    if (isNaN(expiresAt) || expiresAt < Date.now()) return false;

    if (requiredScope && scope !== requiredScope) return false;

    const expectedSig = createHmac("sha256", REAUTH_SECRET).update(payload).digest("hex");
    return sig === expectedSig;
  } catch {
    return false;
  }
}
