import { inspectRequestWithWaf } from "./waf-engine";
import { checkMultiDimensionalRateLimit } from "./rate-limiter";
import {
  computeDeviceFingerprint,
  recordSessionActivity,
  validateSessionStatus,
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
  engageEmergencyContainment,
  verifyReauthProof,
} from "./session-manager";
import {
  setupTwoFactorForUser,
  verifyTwoFactorToken,
  getTwoFactorStatus,
  disableTwoFactorForUser,
} from "./totp-server";
import { evaluateRequestRisk } from "./risk-engine";
import { getSecurityEvents, logSecurityEvent } from "./audit-logger";

export const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; font-src 'self' https: data:; connect-src 'self' https: wss:; media-src 'self' https: blob:; object-src 'none'; frame-ancestors 'self';",
};

export function applySecurityHeaders(headers: Headers): void {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
}

/**
 * Extracts client IP from incoming request headers
 */
export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Safely extracts user ID from a Bearer token without executing arbitrary code
 */
export function extractUserIdFromToken(token?: string | null): string | undefined {
  if (!token || token.split(".").length !== 3) return undefined;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return undefined;
    const jsonStr = Buffer.from(payloadPart, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr) as { sub?: string; user_id?: string; id?: string };
    return payload.sub || payload.user_id || payload.id;
  } catch {
    return undefined;
  }
}

async function safeJsonParse<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

/**
 * Central security gatekeeper invoked on all incoming requests
 */
export async function handleSecurityPreflight(request: Request): Promise<{
  blockedResponse?: Response;
  clientContext: { ip: string; fingerprint: string; userId?: string };
}> {
  const url = new URL(request.url);
  const ip = extractClientIp(request);
  const fingerprint = computeDeviceFingerprint(request.headers, ip);
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const userId = extractUserIdFromToken(token);

  // 1. Layer 1: WAF inspection (Attack patterns, path traversal, probe detection)
  const wafResult = inspectRequestWithWaf({
    url,
    method: request.method,
    headers: request.headers,
    ip,
    fingerprint,
  });

  if (wafResult.blocked) {
    const headers = new Headers({ "Content-Type": "application/json" });
    applySecurityHeaders(headers);
    return {
      blockedResponse: new Response(
        JSON.stringify({
          error: "SECURITY_BLOCK",
          message: wafResult.reason || "Request blocked by security rules",
          category: wafResult.category,
        }),
        { status: wafResult.statusCode || 403, headers },
      ),
      clientContext: { ip, fingerprint, userId },
    };
  }

  // 2. Layer 2: Multi-dimensional Rate Limiting
  const routeCategory =
    url.pathname.includes("/2fa") ||
    url.pathname.includes("/auth") ||
    url.pathname.includes("/reset-password")
      ? "AUTH_SENSITIVE"
      : url.pathname.startsWith("/api/ai/")
        ? "AI"
        : "DEFAULT";

  const rateResult = checkMultiDimensionalRateLimit({
    ip,
    userId,
    fingerprint,
    routeCategory,
    path: url.pathname,
  });

  if (!rateResult.allowed) {
    const headers = new Headers({
      "Content-Type": "application/json",
      "Retry-After": String(rateResult.retryAfterSeconds || 60),
      "X-RateLimit-Limit": String(rateResult.limit),
      "X-RateLimit-Remaining": String(rateResult.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rateResult.resetMs / 1000)),
    });
    applySecurityHeaders(headers);
    return {
      blockedResponse: new Response(
        JSON.stringify({
          error: "TOO_MANY_REQUESTS",
          message: rateResult.reason || "Rate limit exceeded. Please slow down.",
          retryAfter: rateResult.retryAfterSeconds,
          dimension: rateResult.dimension,
        }),
        { status: 429, headers },
      ),
      clientContext: { ip, fingerprint, userId },
    };
  }

  // 3. Layer 3: Server-side Session Status and Revocation Enforcement
  const sessionId = request.headers.get("x-session-id") || token?.slice(-16);
  if (sessionId && userId) {
    const status = validateSessionStatus(sessionId, userId);
    if (!status.valid) {
      logSecurityEvent({
        severity: "HIGH",
        eventType: "REVOKED_SESSION_ACCESS_REJECTED",
        actionTaken: "SESSION_REVOKED",
        userId,
        ip,
        fingerprint,
        path: url.pathname,
        method: request.method,
        details: { sessionId, reason: status.reason },
        riskScore: 85,
      });

      const headers = new Headers({ "Content-Type": "application/json" });
      applySecurityHeaders(headers);
      return {
        blockedResponse: new Response(
          JSON.stringify({
            error: "SESSION_TERMINATED",
            message: status.reason || "Your session has been terminated or revoked.",
          }),
          { status: 401, headers },
        ),
        clientContext: { ip, fingerprint, userId },
      };
    }

    // Update session tracking
    recordSessionActivity({
      sessionId,
      userId,
      userAgent: request.headers.get("user-agent") || "unknown",
      ip,
      fingerprint,
    });
  }

  return { clientContext: { ip, fingerprint, userId } };
}

/**
 * Handles all server-side /api/security/* routes
 */
export async function handleSecurityApiRoutes(
  request: Request,
  context: { ip: string; fingerprint: string; userId?: string },
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/security")) {
    return null;
  }

  const { ip, fingerprint } = context;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const currentUserId = context.userId || extractUserIdFromToken(token);
  const currentSessionId =
    request.headers.get("x-session-id") || token?.slice(-16) || "current_sess";

  const headers = new Headers({ "Content-Type": "application/json" });
  applySecurityHeaders(headers);

  // Endpoint: GET /api/security/health
  if (url.pathname === "/api/security/health" && request.method === "GET") {
    const recentEvents = getSecurityEvents({ limit: 100 });
    return new Response(
      JSON.stringify({
        status: "OPERATIONAL",
        protectionLevel: "ENTERPRISE_DEFENSE_IN_DEPTH",
        waf: { status: "ACTIVE", signaturesLoaded: 26 },
        rateLimiter: { status: "ACTIVE", dimensions: ["IP", "ACCOUNT", "DEVICE", "ACTION"] },
        sessionContainment: { status: "ACTIVE" },
        recentThreatsCount: recentEvents.filter(
          (e) => e.severity === "HIGH" || e.severity === "CRITICAL",
        ).length,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers },
    );
  }

  // Endpoint: GET /api/security/2fa/status
  if (url.pathname === "/api/security/2fa/status" && request.method === "GET") {
    const targetUser = currentUserId || "default_user";
    const status = getTwoFactorStatus(targetUser);
    return new Response(JSON.stringify({ success: true, ...status }), { status: 200, headers });
  }

  // Endpoint: POST /api/security/2fa/setup
  if (url.pathname === "/api/security/2fa/setup" && request.method === "POST") {
    const body = await safeJsonParse<{ email?: string }>(request);
    const targetUser = currentUserId || "default_user";
    const email = body.email || "user@opexnal.com";
    const result = setupTwoFactorForUser(targetUser, email);

    return new Response(JSON.stringify({ success: true, ...result }), { status: 200, headers });
  }

  // Endpoint: POST /api/security/2fa/verify
  if (url.pathname === "/api/security/2fa/verify" && request.method === "POST") {
    const body = await safeJsonParse<{ token?: string }>(request);

    if (!body.token) {
      return new Response(JSON.stringify({ success: false, message: "Token is required" }), {
        status: 400,
        headers,
      });
    }

    const targetUser = currentUserId || "default_user";
    const verifyResult = verifyTwoFactorToken({
      userId: targetUser,
      token: body.token,
      ip,
      fingerprint,
    });

    return new Response(JSON.stringify(verifyResult), {
      status: verifyResult.success ? 200 : 400,
      headers,
    });
  }

  // Endpoint: GET /api/security/sessions
  if (url.pathname === "/api/security/sessions" && request.method === "GET") {
    const targetUser = currentUserId || "default_user";
    const sessions = getUserSessions(targetUser, currentSessionId);
    return new Response(JSON.stringify({ success: true, sessions }), { status: 200, headers });
  }

  // Endpoint: POST /api/security/sessions/revoke
  if (url.pathname === "/api/security/sessions/revoke" && request.method === "POST") {
    const body = await safeJsonParse<{ sessionId?: string }>(request);

    if (!body.sessionId) {
      return new Response(JSON.stringify({ success: false, message: "Session ID required" }), {
        status: 400,
        headers,
      });
    }

    const revoked = revokeSession(
      body.sessionId,
      "User terminated session from Security Dashboard",
    );
    return new Response(JSON.stringify({ success: revoked }), { status: 200, headers });
  }

  // Endpoint: POST /api/security/sessions/revoke-others
  if (url.pathname === "/api/security/sessions/revoke-others" && request.method === "POST") {
    const targetUser = currentUserId || "default_user";
    const count = revokeAllOtherSessions(targetUser, currentSessionId);
    return new Response(JSON.stringify({ success: true, count }), { status: 200, headers });
  }

  // Endpoint: POST /api/security/containment
  if (url.pathname === "/api/security/containment" && request.method === "POST") {
    const body = await safeJsonParse<{ reason?: string }>(request);

    const targetUser = currentUserId || "default_user";
    engageEmergencyContainment(
      targetUser,
      body.reason || "Suspicious automated compromise detected",
      120,
    );
    return new Response(JSON.stringify({ success: true, status: "ACCOUNT_CONTAINED" }), {
      status: 200,
      headers,
    });
  }

  // Endpoint: GET /api/security/audit-logs
  if (url.pathname === "/api/security/audit-logs" && request.method === "GET") {
    const logs = getSecurityEvents({ limit: 40 });
    return new Response(JSON.stringify({ success: true, logs }), { status: 200, headers });
  }

  // Endpoint: POST /api/security/risk-eval
  if (url.pathname === "/api/security/risk-eval" && request.method === "POST") {
    const risk = evaluateRequestRisk({
      ip,
      fingerprint,
      userId: currentUserId,
      path: url.pathname,
      method: request.method,
      userAgent: request.headers.get("user-agent") || undefined,
    });
    return new Response(JSON.stringify({ success: true, risk }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Endpoint not found" }), { status: 404, headers });
}
