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
  verifyOtp,
  evaluatePasswordStrength,
  submitAccountRecoveryRequest,
  getRecoveryStatus,
  recordSecurityAudit,
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
    // 1. Phone / Email OTP Request
    if (pathname === "/api/auth/phone/otp/request" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { phone?: string; email?: string };
      const destination = body.phone || body.email;
      if (!destination || destination.trim().length < 3) {
        return jsonResponse({ error: "Valid phone number or email is required" }, 400);
      }
      // No verified SMS/email delivery provider is wired into this endpoint yet.
      // Do not claim a code was sent when the user cannot actually receive it.
      return jsonResponse(
        { error: "OTP delivery is not configured. Verification is temporarily unavailable." },
        503,
      );
    }

    // 2. Phone / Email OTP Verify
    if (pathname === "/api/auth/phone/otp/verify" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        phone?: string;
        email?: string;
        code?: string;
      };
      const destination = body.phone || body.email;
      const code = body.code || "";
      if (!destination || !code) {
        return jsonResponse({ error: "Destination and verification code are required" }, 400);
      }
      const result = verifyOtp(destination, code);
      if (!result.valid) {
        return jsonResponse({ error: result.error || "Invalid code" }, 400);
      }
      const userId = `user_${destination.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20)}`;
      recordSecurityAudit(userId, "LOGIN_SUCCESS", `Logged in via verified OTP code.`);
      return jsonResponse({
        success: true,
        message: "Verification successful",
        token: `opex_session_${Date.now()}_${userId}`,
        userId,
      });
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

    // 4. 2FA Setup
    if (pathname === "/api/auth/2fa/setup" && method === "POST") {
      // Do not expose unbound TOTP secrets/backup codes without an authenticated
      // account and durable, encrypted per-user storage.
      return jsonResponse(
        { error: "Two-factor setup is not configured securely on the server yet." },
        503,
      );
    }

    // 5. 2FA Verify
    if (pathname === "/api/auth/2fa/verify" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        userId?: string;
        token?: string;
      };
      const token = (body.token || "").trim();
      if (!token) {
        return jsonResponse({ error: "2FA token or backup code is required" }, 400);
      }
      // Fail closed: there is no trusted per-user TOTP secret verifier or
      // single-use backup-code verifier wired to this endpoint yet.
      return jsonResponse(
        { error: "Two-factor verification is not configured on the server yet." },
        503,
      );
    }

    // 6-8. Session management
    // These handlers previously trusted client-supplied IDs and fabricated
    // demo sessions. Until a verified server-side session identity store is
    // connected, fail closed rather than disclose or mutate another user's sessions.
    if (
      (pathname === "/api/auth/sessions" && method === "GET") ||
      (pathname === "/api/auth/sessions/revoke" && method === "POST") ||
      (pathname === "/api/auth/sessions/revoke-all" && method === "POST")
    ) {
      return jsonResponse(
        { error: "Secure server-side session management is not configured yet." },
        503,
      );
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
        ...(body.contactPhone ? { contactPhone: body.contactPhone } : {}),
        ...(body.additionalDetails ? { additionalDetails: body.additionalDetails } : {}),
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
      // Security logs contain sensitive account activity. This route has no
      // trusted server-side identity check yet, so do not expose them publicly.
      return jsonResponse({ error: "Authentication is required." }, 401);
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
      // Fail closed: this handler does not validate a single-use, expiring
      // reset token against a real account before claiming the password changed.
      return jsonResponse(
        { error: "Password reset is not configured securely on the server yet." },
        503,
      );
    }

    // 13. Feed and Stories Fallback API endpoints
    if (pathname === "/api/v1/posts/feed" && method === "GET") {
      const feed = await getHomeFeed("user_maya", null, 10);
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
