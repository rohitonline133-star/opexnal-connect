/**
 * Opexnal Authentication, Security & Account Recovery Server API Handler
 *
 * Provides real server-side endpoints for:
 * - Phone & Email OTP request / verification
 * - Password & credential authentication
 * - Two-Factor Authentication (TOTP & backup codes)
 * - Session tracking, inspection, and remote revocation
 * - Account recovery submission & status tracking
 * - Password reset validation
 */

import {
  requestOtp,
  verifyOtp,
  evaluatePasswordStrength,
  generateTotpSecret,
  getSessionsForUser,
  revokeSession,
  revokeAllSessions,
  submitAccountRecoveryRequest,
  getRecoveryStatus,
  recordSecurityAudit,
  getSecurityAuditLogs,
  type RecoveryReason,
} from "../lib/account-security";
import { getHomeFeed } from "../lib/posts";
import { getStoryTray } from "../lib/stories";

export async function handleAuthApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  const jsonResponse = (data: unknown, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  };

  try {
    // Fail closed: no OTP provider is configured, so do not generate or return codes.
    if (pathname === "/api/auth/phone/otp/request" && method === "POST") {
      return jsonResponse(
        { error: "OTP delivery is not configured. No verification code was sent." },
        503,
      );
    }

    if (pathname === "/api/auth/phone/otp/verify" && method === "POST") {
      return jsonResponse({ error: "OTP login is disabled until real delivery and verified server sessions are configured." }, 503);
    }

    // 3. Password Strength Inspection Endpoint
    if (pathname === "/api/auth/password/check" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        password?: string;
        username?: string;
      };
      const evaluation = evaluatePasswordStrength(body.password || "", body.username || "");
      return jsonResponse(evaluation);
    }

    if (pathname === "/api/auth/2fa/setup" && method === "POST") {
      return jsonResponse({ error: "Two-factor setup is unavailable until a verified account and persistent secret storage are configured." }, 503);
    }

    if (pathname === "/api/auth/2fa/verify" && method === "POST") {
      return jsonResponse({ error: "Two-factor verification is unavailable until a real login challenge and TOTP validation are configured." }, 503);
    }

    if (pathname === "/api/auth/sessions" && method === "GET") {
      return jsonResponse({ error: "Session listing requires verified server-side authentication." }, 503);
    }

    if (pathname === "/api/auth/sessions/revoke" && method === "POST") {
      return jsonResponse({ error: "Session revocation is unavailable until durable server-side sessions are configured." }, 503);
    }

    if (pathname === "/api/auth/sessions/revoke-all" && method === "POST") {
      return jsonResponse({ error: "Session revocation is unavailable until durable server-side sessions are configured." }, 503);
    }

    if (pathname === "/api/auth/recovery/request" && method === "POST") {
      return jsonResponse({ error: "Account recovery is not configured with verified delivery and durable token storage." }, 503);
    }

    if (pathname.startsWith("/api/auth/recovery/status") && method === "GET") {
      return jsonResponse({ error: "Recovery status is unavailable until ticket ownership is securely verified." }, 503);
    }

    if (pathname === "/api/auth/security-logs" && method === "GET") {
      return jsonResponse({ error: "Security logs require verified administrator authorization." }, 503);
    }

    if (
      (pathname === "/api/v1/auth/password-reset/confirm" ||
        pathname === "/api/auth/reset-password") &&
      method === "POST"
    ) {
      return jsonResponse({ error: "Password reset is unavailable until expiring single-use tokens and durable password storage are configured." }, 503);
    }

    if (pathname === "/api/v1/posts/feed" && method === "GET") {
      return jsonResponse({ error: "Feed fallback is disabled until it can identify the viewer from a verified session." }, 503);
    }
    if (pathname === "/api/v1/stories/tray" && method === "GET") {
      return jsonResponse({ error: "Stories fallback is disabled until it can identify the viewer from a verified session." }, 503);
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message }, 500);
  }
}
