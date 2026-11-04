/**
 * Legacy in-process auth fallback.
 *
 * Authentication, sessions, OTP, MFA, recovery and feed data must be handled by
 * the configured first-party API. This fallback deliberately fails closed:
 * it must never mint tokens, accept format-only MFA codes, expose audit logs,
 * fabricate sessions, or return demo feed/story data.
 */
import { evaluatePasswordStrength } from "../lib/account-security";

export async function handleAuthApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  const jsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });

  // Password strength evaluation is local, non-authenticating functionality.
  if (pathname === "/api/auth/password/check" && method === "POST") {
    const body = (await request.json().catch(() => ({}))) as {
      password?: string;
      username?: string;
    };
    return jsonResponse(evaluatePasswordStrength(body.password || "", body.username || ""));
  }

  // All security-sensitive and data-bearing legacy routes require the real API.
  // A 503 is intentional: unavailable authentication must never degrade to a
  // fabricated identity, session, OTP, recovery approval, audit log, or demo feed.
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/v1/")) {
    const error =
      pathname === "/api/auth/phone/otp/request"
        ? "OTP delivery is not configured. This legacy endpoint is disabled; configure and use the first-party Opexnal API."
        : "This legacy endpoint is disabled. Configure and use the first-party Opexnal API.";
    return jsonResponse({ error }, 503);
  }

  return jsonResponse({ error: "Endpoint not found" }, 404);
}
