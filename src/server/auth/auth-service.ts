import { randomUUID } from "node:crypto";
import { dbQuery, withTransaction } from "../db/index";
import { hashPassword, verifyPassword } from "./password";
import {
  issueAccessToken,
  issueRefreshToken,
  verifyAndRotateRefreshToken,
  generateSessionIdentifier,
  hashSessionId,
  verifyAccessToken,
  UserTokenPayload,
} from "./tokens";
import { generateOtp, verifyOtp } from "./otp";
import {
  recordSessionActivity,
  validateSessionStatus,
  revokeSession as revokeSessionManager,
  revokeAllOtherSessions as revokeOthersSessionManager,
  isAccountContained,
} from "../security/session-manager";
import {
  setupTwoFactorForUser,
  verifyTwoFactorToken,
  getTwoFactorStatus,
} from "../security/totp-server";
import { logSecurityEvent } from "../security/audit-logger";

export interface RegisterParams {
  email: string;
  username: string;
  password: string;
  displayName?: string | undefined;
  phone?: string | undefined;
}

export interface LoginParams {
  emailOrUsername: string;
  password: string;
  ip: string;
  userAgent: string;
  fingerprint: string;
}

export interface AuthResult {
  success: boolean;
  user?:
    | {
        id: string;
        email: string;
        username: string;
        displayName: string;
        role: string;
        avatarUrl: string | null;
      }
    | undefined;
  token?: string | undefined;
  refreshToken?: string | undefined;
  sessionId?: string | undefined;
  requires2fa?: boolean | undefined;
  message?: string | undefined;
  reused?: boolean | undefined;
}

export async function registerUser(params: RegisterParams): Promise<AuthResult> {
  const email = params.email.trim().toLowerCase();
  const username = params.username.trim().toLowerCase();

  if (!email || !username || !params.password) {
    return { success: false, message: "Email, username, and password are required" };
  }

  if (params.password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters long" };
  }

  // Check uniqueness
  const existing = await dbQuery<{ id: string; email: string; username: string }>(
    "SELECT id, email, username FROM users WHERE email = $1 OR username = $2",
    [email, username],
  );
  if (existing.rows.length > 0) {
    const isEmail = existing.rows.some((r) => r.email.toLowerCase() === email);
    return {
      success: false,
      message: isEmail ? "An account with this email already exists" : "Username is already taken",
    };
  }

  const { hash, salt } = hashPassword(params.password);
  const userId = randomUUID();
  const now = new Date().toISOString();

  await withTransaction(async (client) => {
    // 1. Insert into users
    await client.query(
      `INSERT INTO users (id, email, username, phone, password_hash, salt, role, status, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        email,
        username,
        params.phone || null,
        hash,
        salt,
        "user",
        "active",
        false,
        now,
        now,
      ],
    );

    // 2. Initialize profile
    const displayName = params.displayName || username;
    await client.query(
      `INSERT INTO profiles (id, username, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, username, displayName, now, now],
    );

    // 3. Initialize default settings
    await client.query(
      `INSERT INTO settings (user_id, settings_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, JSON.stringify({ email, username, notifications: true }), now, now],
    );
  });

  // Create initial session
  const { rawSessionId, hashedToken } = generateSessionIdentifier();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await dbQuery(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, fingerprint, is_active, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, true, $6, $7)`,
    [rawSessionId, userId, hashedToken, "127.0.0.1", "init-fp", expiresAt, now],
  );

  recordSessionActivity({
    sessionId: rawSessionId,
    userId,
    userAgent: "init-agent",
    ip: "127.0.0.1",
    fingerprint: "init-fp",
  });

  const token = issueAccessToken({
    userId,
    email,
    username,
    role: "user",
    sessionId: rawSessionId,
  });

  const { refreshToken } = issueRefreshToken({
    sessionId: rawSessionId,
    userId,
  });

  return {
    success: true,
    user: {
      id: userId,
      email,
      username,
      displayName: params.displayName || username,
      role: "user",
      avatarUrl: null,
    },
    token,
    refreshToken,
    sessionId: rawSessionId,
  };
}

export async function loginUser(params: LoginParams): Promise<AuthResult> {
  const queryTerm = params.emailOrUsername.trim().toLowerCase();

  const userRes = await dbQuery<{
    id: string;
    email: string;
    username: string;
    password_hash: string;
    salt: string;
    role: string;
    status: string;
    two_factor_enabled: boolean;
  }>(
    "SELECT id, email, username, password_hash, salt, role, status, two_factor_enabled FROM users WHERE email = $1 OR username = $2",
    [queryTerm, queryTerm],
  );

  if (userRes.rows.length === 0 || !userRes.rows[0]) {
    return { success: false, message: "Invalid email/username or password" };
  }

  const user = userRes.rows[0];

  // Check account quarantine / containment status
  if (isAccountContained(user.id).isContained || user.status === "quarantined") {
    return {
      success: false,
      message:
        "Account is temporarily quarantined due to security containment. Please contact support.",
    };
  }

  // Verify password
  const isValid = verifyPassword(params.password, user.password_hash, user.salt);
  if (!isValid) {
    logSecurityEvent({
      severity: "MEDIUM",
      eventType: "AUTH_LOGIN_FAILED",
      actionTaken: "CHALLENGE_REQUIRED",
      ip: params.ip,
      fingerprint: params.fingerprint,
      path: "/api/v1/auth/login",
      method: "POST",
      details: { targetUser: user.username },
      riskScore: 35,
    });
    return { success: false, message: "Invalid email/username or password" };
  }

  // Check if 2FA is required
  const totpStatus = getTwoFactorStatus(user.id);
  if (user.two_factor_enabled || totpStatus.enabled) {
    return {
      success: true,
      requires2fa: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.username,
        role: user.role,
        avatarUrl: null,
      },
    };
  }

  // Fetch profile for display name & avatar
  const profileRes = await dbQuery<{ display_name: string; avatar_url: string | null }>(
    "SELECT display_name, avatar_url FROM profiles WHERE id = $1",
    [user.id],
  );
  const displayName = profileRes.rows[0]?.display_name || user.username;
  const avatarUrl = profileRes.rows[0]?.avatar_url || null;

  // Create authoritative session
  const { rawSessionId, hashedToken } = generateSessionIdentifier();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await dbQuery(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, fingerprint, is_active, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, true, $6, $7)`,
    [
      rawSessionId,
      user.id,
      hashedToken,
      params.ip,
      params.fingerprint,
      expiresAt,
      new Date().toISOString(),
    ],
  );

  recordSessionActivity({
    sessionId: rawSessionId,
    userId: user.id,
    userAgent: params.userAgent,
    ip: params.ip,
    fingerprint: params.fingerprint,
  });

  const token = issueAccessToken({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    sessionId: rawSessionId,
  });

  const { refreshToken } = issueRefreshToken({
    sessionId: rawSessionId,
    userId: user.id,
  });

  logSecurityEvent({
    severity: "LOW",
    eventType: "AUTH_LOGIN_SUCCESS",
    actionTaken: "ALLOW",
    userId: user.id,
    ip: params.ip,
    fingerprint: params.fingerprint,
    path: "/api/v1/auth/login",
    method: "POST",
    details: { userId: user.id, sessionId: rawSessionId },
    riskScore: 10,
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName,
      role: user.role,
      avatarUrl,
    },
    token,
    refreshToken,
    sessionId: rawSessionId,
  };
}

export async function completeTwoFactorLogin(
  userId: string,
  tokenOrBackupCode: string,
  ip: string,
  userAgent: string,
  fingerprint: string,
): Promise<AuthResult> {
  const result = verifyTwoFactorToken({
    userId,
    token: tokenOrBackupCode,
    ip,
    fingerprint,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  const userRes = await dbQuery<{ id: string; email: string; username: string; role: string }>(
    "SELECT id, email, username, role FROM users WHERE id = $1",
    [userId],
  );
  if (userRes.rows.length === 0 || !userRes.rows[0]) {
    return { success: false, message: "User not found" };
  }
  const user = userRes.rows[0];

  const profileRes = await dbQuery<{ display_name: string; avatar_url: string | null }>(
    "SELECT display_name, avatar_url FROM profiles WHERE id = $1",
    [user.id],
  );
  const displayName = profileRes.rows[0]?.display_name || user.username;
  const avatarUrl = profileRes.rows[0]?.avatar_url || null;

  const { rawSessionId, hashedToken } = generateSessionIdentifier();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await dbQuery(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, fingerprint, is_active, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, true, $6, $7)`,
    [rawSessionId, user.id, hashedToken, ip, fingerprint, expiresAt, new Date().toISOString()],
  );

  recordSessionActivity({
    sessionId: rawSessionId,
    userId: user.id,
    userAgent,
    ip,
    fingerprint,
  });

  const token = issueAccessToken({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    sessionId: rawSessionId,
  });

  const { refreshToken } = issueRefreshToken({
    sessionId: rawSessionId,
    userId: user.id,
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName,
      role: user.role,
      avatarUrl,
    },
    token,
    refreshToken,
    sessionId: rawSessionId,
  };
}

export async function rotateUserTokens(oldRefreshToken: string): Promise<AuthResult> {
  const rotation = verifyAndRotateRefreshToken(oldRefreshToken);
  if (!rotation.success) {
    if (rotation.reused && rotation.payload) {
      // Replay attack detected! Terminate the entire compromised session
      await logoutSession(rotation.payload.sessionId);
    }
    return {
      success: false,
      reused: rotation.reused,
      message: rotation.message || "Invalid refresh token",
    };
  }

  const payload = rotation.payload!;
  // Validate session status in DB
  const sessionStatus = validateSessionStatus(payload.sessionId, payload.userId);
  if (!sessionStatus.valid) {
    return { success: false, message: sessionStatus.reason || "Session expired or revoked" };
  }

  const userRes = await dbQuery<{ id: string; email: string; username: string; role: string }>(
    "SELECT id, email, username, role FROM users WHERE id = $1",
    [payload.userId],
  );
  if (userRes.rows.length === 0 || !userRes.rows[0]) {
    return { success: false, message: "User not found" };
  }
  const u = userRes.rows[0];

  const profileRes = await dbQuery<{ display_name: string; avatar_url: string | null }>(
    "SELECT display_name, avatar_url FROM profiles WHERE id = $1",
    [u.id],
  );
  const displayName = profileRes.rows[0]?.display_name || u.username;
  const avatarUrl = profileRes.rows[0]?.avatar_url || null;

  const newAccessToken = issueAccessToken({
    userId: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    sessionId: payload.sessionId,
  });

  return {
    success: true,
    token: newAccessToken,
    refreshToken: rotation.newRefreshToken,
    sessionId: payload.sessionId,
    user: {
      id: u.id,
      email: u.email,
      username: u.username,
      displayName,
      role: u.role,
      avatarUrl,
    },
  };
}

export async function validateUserSession(tokenOrSessionId: string): Promise<{
  valid: boolean;
  user?: UserTokenPayload | undefined;
  sessionId?: string | undefined;
  error?: string | undefined;
}> {
  // If it's a JWT
  if (tokenOrSessionId.includes(".")) {
    const payload = verifyAccessToken(tokenOrSessionId);
    if (!payload) {
      return { valid: false, error: "Invalid or expired token" };
    }

    // Check session status in session manager & DB
    const sessionStatus = validateSessionStatus(payload.sessionId, payload.userId);
    if (!sessionStatus.valid) {
      return { valid: false, error: sessionStatus.reason || "Session revoked" };
    }

    const dbCheck = await dbQuery<{ is_active: boolean }>(
      "SELECT is_active FROM sessions WHERE id = $1",
      [payload.sessionId],
    );
    if (dbCheck.rows.length > 0 && dbCheck.rows[0] && dbCheck.rows[0].is_active === false) {
      return { valid: false, error: "Session marked inactive in database" };
    }

    return { valid: true, user: payload, sessionId: payload.sessionId };
  }

  // If it's a raw session ID
  const hash = hashSessionId(tokenOrSessionId);
  const sessionRes = await dbQuery<{
    id: string;
    user_id: string;
    is_active: boolean;
    expires_at: string;
  }>("SELECT id, user_id, is_active, expires_at FROM sessions WHERE id = $1 OR token_hash = $2", [
    tokenOrSessionId,
    hash,
  ]);

  if (sessionRes.rows.length === 0 || !sessionRes.rows[0] || !sessionRes.rows[0].is_active) {
    return { valid: false, error: "Session revoked or not found" };
  }

  const s = sessionRes.rows[0];
  if (new Date(s.expires_at).getTime() < Date.now()) {
    return { valid: false, error: "Session expired" };
  }

  const userRes = await dbQuery<{ id: string; email: string; username: string; role: string }>(
    "SELECT id, email, username, role FROM users WHERE id = $1",
    [s.user_id],
  );
  if (userRes.rows.length === 0 || !userRes.rows[0]) {
    return { valid: false, error: "User not found" };
  }

  const u = userRes.rows[0];
  return {
    valid: true,
    user: {
      userId: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      sessionId: s.id,
    },
    sessionId: s.id,
  };
}

export async function logoutSession(sessionId: string): Promise<void> {
  revokeSessionManager(sessionId, "User logged out");
  await dbQuery("UPDATE sessions SET is_active = false, revocation_reason = $1 WHERE id = $2", [
    "User logged out",
    sessionId,
  ]);
}

export async function revokeOtherSessions(
  userId: string,
  currentSessionId: string,
): Promise<number> {
  revokeOthersSessionManager(userId, currentSessionId);
  const res = await dbQuery(
    "UPDATE sessions SET is_active = false, revocation_reason = $1 WHERE user_id = $2 AND id != $3",
    ["User initiated revoke others", userId, currentSessionId],
  );
  return res.rowCount;
}
