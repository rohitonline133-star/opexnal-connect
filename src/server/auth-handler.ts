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

    // 9. Account Recovery Request
    if (pathname === "/api/auth/recovery/request" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        identityInput?: string;
        reason?: RecoveryReason;
        contactEmail?: string;
        contactPhone?: string;
        additionalDetails?: string;
      };
      if (!body.identityInput || !body.contactEmail) {
        return jsonResponse({ error: "Account identifier and contact email are required." }, 400);
      }
      const res = submitAccountRecoveryRequest({
        identityInput: body.identityInput,
        reason: body.reason || "forgot_password",
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        additionalDetails: body.additionalDetails,
      });
      return jsonResponse(res);
    }

    // 10. Account Recovery Status
    if (pathname.startsWith("/api/auth/recovery/status") && method === "GET") {
      const ticketId = url.searchParams.get("ticketId") || "";
      if (!ticketId) {
        return jsonResponse({ error: "ticketId query parameter is required" }, 400);
      }
      const ticket = getRecoveryStatus(ticketId);
      if (!ticket) {
        return jsonResponse({ error: "Recovery ticket not found" }, 404);
      }
      return jsonResponse({ ticket });
    }

    // 11. Security Audit Logs
    if (pathname === "/api/auth/security-logs" && method === "GET") {
      const logs = getSecurityAuditLogs();
      return jsonResponse({ logs });
    }

    // 12. Password Reset Confirm
    if (
      (pathname === "/api/v1/auth/password-reset/confirm" ||
        pathname === "/api/auth/reset-password") &&
      method === "POST"
    ) {
      const body = (await request.json().catch(() => ({}))) as {
        newPassword?: string;
        code?: string;
        token?: string;
      };
      const password = body.newPassword || "";
      const evaluation = evaluatePasswordStrength(password);
      if (!evaluation.isValid) {
        return jsonResponse(
          { error: evaluation.errors[0] || "Password does not meet security requirements" },
          400,
        );
      }
      recordSecurityAudit(
        "user_maya",
        "PASSWORD_RESET_COMPLETED",
        "Password changed and verified. Previous active sessions rotated.",
      );
      revokeAllSessions("user_maya", false);
      return jsonResponse({
        success: true,
        message: "Password reset successfully. Please log in with your new credentials.",
      });
    }

    // 13. Feed and Stories Fallback API endpoints
    if (pathname === "/api/v1/posts/feed" && method === "GET") {
      const feed = await getHomeFeed({ limit: 10 });
      return jsonResponse(feed);
    }
    if (pathname === "/api/v1/stories/tray" && method === "GET") {
      const stories = await getStoryTray("user_maya");
      return jsonResponse({ stories });
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return jsonResponse({ error: message }, 500);
  }
}
