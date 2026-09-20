import {
  registerUser,
  loginUser,
  completeTwoFactorLogin,
  logoutSession,
  validateUserSession,
} from "../../auth/auth-service";
import { generateOtp, verifyOtp } from "../../auth/otp";
import { extractAuth, requireAuth } from "../../security/authorizer";
import {
  setupTwoFactorForUser,
  verifyTwoFactorToken,
  disableTwoFactorForUser,
  getTwoFactorStatus,
} from "../../security/totp-server";
import { issueReauthProof } from "../../security/session-manager";
import { dbQuery } from "../../db/index";
import { hashPassword } from "../../auth/password";

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export async function handleAuthRoutes(
  request: Request,
  pathname: string,
  clientIp: string,
  userAgent: string,
  fingerprint: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // POST /api/v1/auth/register
  if (pathname === "/api/v1/auth/register" && method === "POST") {
    try {
      const body = (await request.json()) as {
        email?: string;
        username?: string;
        password?: string;
        displayName?: string;
        phone?: string;
      };
      if (!body.email || !body.username || !body.password) {
        return json({ error: "Email, username, and password are required" }, 400);
      }
      const res = await registerUser({
        email: body.email,
        username: body.username,
        password: body.password,
        displayName: body.displayName,
        phone: body.phone,
      });
      if (!res.success) {
        return json({ error: res.message }, 400);
      }
      return json(res, 201, {
        "Set-Cookie": `opexnal_token=${res.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
      });
    } catch (e: unknown) {
      return json({ error: e instanceof Error ? e.message : "Registration failed" }, 500);
    }
  }

  // POST /api/v1/auth/login
  if (pathname === "/api/v1/auth/login" && method === "POST") {
    try {
      const body = (await request.json()) as {
        emailOrUsername?: string;
        email?: string;
        password?: string;
      };
      const identifier = body.emailOrUsername || body.email;
      if (!identifier || !body.password) {
        return json({ error: "Email/username and password are required" }, 400);
      }
      const res = await loginUser({
        emailOrUsername: identifier,
        password: body.password,
        ip: clientIp,
        userAgent,
        fingerprint,
      });
      if (!res.success) {
        return json({ error: res.message }, 401);
      }
      if (res.requires2fa) {
        return json(res, 200);
      }
      return json(res, 200, {
        "Set-Cookie": `opexnal_token=${res.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
      });
    } catch (e: unknown) {
      return json({ error: e instanceof Error ? e.message : "Login failed" }, 500);
    }
  }

  // POST /api/v1/auth/2fa-verify
  if (pathname === "/api/v1/auth/2fa-verify" && method === "POST") {
    try {
      const body = (await request.json()) as { userId?: string; token?: string };
      if (!body.userId || !body.token) {
        return json({ error: "userId and 2FA token are required" }, 400);
      }
      const res = await completeTwoFactorLogin(
        body.userId,
        body.token,
        clientIp,
        userAgent,
        fingerprint,
      );
      if (!res.success) {
        return json({ error: res.message }, 401);
      }
      return json(res, 200, {
        "Set-Cookie": `opexnal_token=${res.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
      });
    } catch (e: unknown) {
      return json({ error: e instanceof Error ? e.message : "2FA verification failed" }, 500);
    }
  }

  // POST /api/v1/auth/logout
  if (pathname === "/api/v1/auth/logout" && method === "POST") {
    const auth = await extractAuth(request);
    if (auth) {
      await logoutSession(auth.sessionId);
    }
    return json({ success: true, message: "Logged out successfully" }, 200, {
      "Set-Cookie": "opexnal_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    });
  }

  // GET /api/v1/auth/session or /api/v1/auth/me
  if ((pathname === "/api/v1/auth/session" || pathname === "/api/v1/auth/me") && method === "GET") {
    const auth = await extractAuth(request);
    if (!auth) {
      return json({ session: null, user: null }, 200);
    }
    const profile = await dbQuery<{ display_name: string; avatar_url: string | null }>(
      "SELECT display_name, avatar_url FROM profiles WHERE id = $1",
      [auth.user.userId],
    );
    return json(
      {
        session: { id: auth.sessionId, userId: auth.user.userId },
        user: {
          id: auth.user.userId,
          email: auth.user.email,
          username: auth.user.username,
          displayName: profile.rows[0]?.display_name || auth.user.username,
          avatarUrl: profile.rows[0]?.avatar_url || null,
          role: auth.user.role,
        },
      },
      200,
    );
  }

  // POST /api/v1/auth/password-reset/request
  if (pathname === "/api/v1/auth/password-reset/request" && method === "POST") {
    const body = (await request.json()) as { email?: string };
    if (!body.email) return json({ error: "Email is required" }, 400);
    const otp = generateOtp(body.email, "password_reset");
    return json({ success: true, message: "Password reset code sent to email", testOtp: otp });
  }

  // POST /api/v1/auth/password-reset/confirm
  if (pathname === "/api/v1/auth/password-reset/confirm" && method === "POST") {
    const body = (await request.json()) as { email?: string; code?: string; newPassword?: string };
    if (!body.email || !body.code || !body.newPassword) {
      return json({ error: "Email, code, and new password are required" }, 400);
    }
    const check = verifyOtp(body.email, "password_reset", body.code);
    if (!check.valid) {
      return json({ error: check.message }, 400);
    }
    const { hash, salt } = hashPassword(body.newPassword);
    await dbQuery(
      "UPDATE users SET password_hash = $1, salt = $2, updated_at = now() WHERE email = $3",
      [hash, salt, body.email.toLowerCase().trim()],
    );
    return json({ success: true, message: "Password updated successfully" });
  }

  // POST /api/v1/auth/phone/request-otp
  if (pathname === "/api/v1/auth/phone/request-otp" && method === "POST") {
    const body = (await request.json()) as { phone?: string };
    if (!body.phone) return json({ error: "Phone number is required" }, 400);
    const otp = generateOtp(body.phone, "phone_verification");
    return json({ success: true, message: "Phone OTP sent", testOtp: otp });
  }

  // POST /api/v1/auth/phone/verify-otp
  if (pathname === "/api/v1/auth/phone/verify-otp" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as { phone?: string; code?: string };
    if (!body.phone || !body.code) return json({ error: "Phone and code are required" }, 400);
    const check = verifyOtp(body.phone, "phone_verification", body.code);
    if (!check.valid) return json({ error: check.message }, 400);
    await dbQuery("UPDATE users SET phone = $1, phone_verified = true WHERE id = $2", [
      body.phone,
      auth.user.userId,
    ]);
    return json({ success: true, message: "Phone number verified" });
  }

  // POST /api/v1/auth/2fa/setup
  if (pathname === "/api/v1/auth/2fa/setup" && method === "POST") {
    const auth = await requireAuth(request);
    const setup = setupTwoFactorForUser(auth.user.userId, auth.user.email);
    return json({ success: true, ...setup });
  }

  // POST /api/v1/auth/2fa/disable
  if (pathname === "/api/v1/auth/2fa/disable" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as { token?: string };
    if (!body.token)
      return json({ error: "2FA token or backup code required to disable 2FA" }, 400);
    const check = verifyTwoFactorToken({
      userId: auth.user.userId,
      token: body.token,
      ip: clientIp,
      fingerprint,
    });
    if (!check.success) return json({ error: check.message }, 400);
    disableTwoFactorForUser(auth.user.userId);
    return json({ success: true, message: "2FA has been disabled" });
  }

  // POST /api/v1/auth/reauth/issue
  if (pathname === "/api/v1/auth/reauth/issue" && method === "POST") {
    const auth = await requireAuth(request);
    const body = (await request.json()) as { scope?: string };
    const proof = issueReauthProof(auth.user.userId, body.scope || "sensitive_operation");
    return json({ success: true, reauthProof: proof });
  }

  return null;
}
