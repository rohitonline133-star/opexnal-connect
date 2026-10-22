import "dotenv/config";
import express from "express";
import http from "node:http";
import path from "node:path";
import { mkdirSync, unlinkSync } from "node:fs";
import { createHash, createHmac, randomUUID, scrypt as scryptCallback, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import pg from "pg";
import { WebSocketServer } from "ws";
import nodemailer from "nodemailer";
import multer from "multer";
import { fileTypeFromFile } from "file-type";

const { Pool } = pg;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const port = Number(process.env.PORT || process.env.API_PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "";
const databaseUrl = process.env.DATABASE_URL || "";
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000").split(",").map((v) => v.trim());
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined, max: Number(process.env.DB_POOL_MAX || 10) }) : null;
const smtpHost = process.env.SMTP_HOST || "";
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || "";
const publicApiUrl = process.env.PUBLIC_API_URL || "";
const emailTransport =
  smtpHost && smtpUser && smtpPass && smtpFrom
    ? nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;
const mediaRoot = process.env.MEDIA_STORAGE_DIR || path.join(process.cwd(), "media");
const allowedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const mediaExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      mkdirSync(mediaRoot, { recursive: true });
      callback(null, mediaRoot);
    },
    filename: (_req, file, callback) => {
      const extension = mediaExtensions[file.mimetype];
      if (!extension) return callback(new Error("Unsupported media type."));
      return callback(null, `${randomUUID()}.${extension}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMediaTypes.has(file.mimetype)) return callback(new Error("Unsupported media type."));
    return callback(null, true);
  },
});
const mediaKeyPattern = /^[0-9a-f-]{36}\.(jpg|png|webp|gif|mp4|webm|mov)$/i;
function signMediaUrl(objectKey, expires) {
  return createHmac("sha256", jwtSecret).update(`${objectKey}:${expires}`).digest("hex");
}
const socketsByUser = new Map();
const attempts = new Map();
const scrypt = promisify(scryptCallback);

if (jwtSecret.length < 32) {
  console.warn("JWT_SECRET must be a unique random value of at least 32 characters.");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to start in production without a JWT_SECRET of at least 32 characters.");
  }
}
if (!pool) console.warn("DATABASE_URL is missing; API will return 503 for database-backed routes.");

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
function dbRequired(_req, res, next) {
  if (!pool) return res.status(503).json({ error: "Database is not configured on this deployment." });
  next();
}
function rateLimit(key, max = 10, windowMs = 60_000) {
  const now = Date.now();
  // Keep the in-process fallback bounded; use Redis/shared storage for multi-instance production.
  if (attempts.size > 10_000) {
    for (const [attemptKey, record] of attempts) {
      if (record.resetAt <= now) attempts.delete(attemptKey);
    }
  }
  if (attempts.size >= 20_000 && !attempts.has(key)) return false;
  const old = attempts.get(key);
  if (!old || old.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  old.count += 1;
  return old.count <= max;
}
async function authRequired(req, res, next) {
  if (!pool) return res.status(503).json({ error: "Database is not configured." });
  if (!jwtSecret || jwtSecret.length < 32) {
    return res.status(503).json({ error: "JWT_SECRET is not configured securely." });
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required." });

  let claims;
  try {
    claims = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
      issuer: "opexnal-api",
      audience: "opexnal-app",
    });
  } catch {
    return res.status(401).json({ error: "Invalid or expired access token." });
  }
  if (
    !claims ||
    typeof claims !== "object" ||
    typeof claims.sub !== "string" ||
    typeof claims.jti !== "string"
  ) {
    return res.status(401).json({ error: "Invalid or expired access token." });
  }

  try {
    const activeSession = await pool.query(
      "SELECT id FROM auth_sessions WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at > NOW()",
      [claims.jti, claims.sub],
    );
    if (!activeSession.rowCount) {
      return res.status(401).json({ error: "Session has been revoked or expired." });
    }
    req.authSessionId = claims.jti;
    req.user = {
      id: claims.sub,
      username: typeof claims.username === "string" ? claims.username : "",
    };
    return next();
  } catch (error) {
    return next(error);
  }
}
async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return "scrypt:" + salt.toString("hex") + ":" + Buffer.from(derived).toString("hex");
}
async function verifyPassword(password, stored) {
  const parts = String(stored).split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const actual = Buffer.from(await scrypt(password, Buffer.from(parts[1], "hex"), 64));
    const expected = Buffer.from(parts[2], "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
async function issueToken(user, req) {
  if (jwtSecret.length < 32) throw new Error("JWT_SECRET is not configured securely.");
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO auth_sessions (id, user_id, expires_at, user_agent, ip_address) VALUES ($1,$2,$3,$4,$5)",
    [
      sessionId,
      user.id,
      expiresAt,
      String(req.headers["user-agent"] || "").slice(0, 512) || null,
      req.ip || null,
    ],
  );
  return jwt.sign(
    { username: user.username },
    jwtSecret,
    {
      subject: user.id,
      jwtid: sessionId,
      expiresIn: "1h",
      issuer: "opexnal-api",
      audience: "opexnal-app",
      algorithm: "HS256",
    },
  );
}
function publicUser(row) {
  return { id: row.id, username: row.username, email: row.email, displayName: row.display_name, avatarUrl: row.avatar_url, createdAt: row.created_at };
}
function publicProfile(row) {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio || "",
    avatar_url: row.avatar_url || null,
    posts_count: Number(row.posts_count || 0),
    followers_count: Number(row.followers_count || 0),
    following_count: Number(row.following_count || 0),
    is_verified: false,
    is_private: Boolean(row.is_private),
    is_deactivated: Boolean(row.is_deactivated),
    website: row.website || null,
    location: row.location || null,
    locale: row.locale || "en",
    timezone: row.timezone || "UTC",
    account_type: row.account_type || "personal",
    allow_mentions_from: row.allow_mentions_from || "everyone",
    allow_tags_from: row.allow_tags_from || "everyone",
    show_activity_status: Boolean(row.show_activity_status),
    country_code: row.country_code || null,
    last_active_at: row.last_active_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
function validUsername(value) { return typeof value === "string" && /^[a-zA-Z0-9._]{3,30}$/.test(value); }
function validEmail(value) { return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= 12 &&
    value.length <= 128 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^a-zA-Z0-9]/.test(value)
  );
}

app.get("/health", async (_req, res) => {
  if (!pool) return res.status(503).json({ status: "not_ready", service: "opexnal-api", reason: "database_not_configured" });
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ok", service: "opexnal-api", database: "connected", websocket: true });
  } catch {
    return res.status(503).json({ status: "not_ready", service: "opexnal-api", reason: "database_unavailable" });
  }
});

app.get("/api/v1/auth/username-availability", dbRequired, async (req, res, next) => {
  const username = typeof req.query.username === "string" ? req.query.username.trim().toLowerCase() : "";
  if (!validUsername(username)) {
    return res.status(400).json({ available: false, error: "Username must be 3–30 characters using letters, numbers, dots, or underscores." });
  }
  if (!rateLimit("username-check:" + String(req.ip || "unknown"), 30)) {
    return res.status(429).json({ available: false, error: "Too many username checks. Try again shortly." });
  }
  if (["admin", "system", "root", "instagram", "meta", "support", "security"].includes(username)) {
    return res.json({ username, available: false });
  }
  try {
    const result = await pool.query("SELECT 1 FROM users WHERE username=$1 LIMIT 1", [username]);
    return res.json({ username, available: result.rowCount === 0 });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/auth/signup", dbRequired, async (req, res, next) => {
  if (!emailTransport || !publicApiUrl) {
    return res.status(503).json({
      error: "Email verification delivery is not configured. No account was created.",
    });
  }
  const { username, email, password, displayName, dateOfBirth } = req.body || {};
  if (!rateLimit("signup:" + String(req.ip || "unknown"), 5)) {
    return res.status(429).json({ error: "Too many signup attempts. Try again later." });
  }
  if (!validUsername(username) || !validEmail(email) || !validPassword(password)) {
    return res.status(400).json({
      error: "Use a 3–30 character username, valid email, and password of 12–128 characters with mixed character classes.",
    });
  }
  if (
    !rateLimit("signup-email:" + email.toLowerCase(), 3) ||
    !rateLimit("signup-username:" + username.toLowerCase(), 3)
  ) {
    return res.status(429).json({ error: "Too many signup attempts for this email or username." });
  }
  const birthDate = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : null;
  if (!birthDate || !Number.isFinite(birthDate.getTime()) || birthDate.getTime() > Date.now()) {
    return res.status(400).json({ error: "A valid date of birth is required." });
  }
  const ageCutoff = new Date();
  ageCutoff.setFullYear(ageCutoff.getFullYear() - 13);
  if (birthDate > ageCutoff) {
    return res.status(400).json({ error: "You must be at least 13 years old to create an account." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const passwordHash = await hashPassword(password);
    const result = await client.query(
      "INSERT INTO users (id, username, email, password_hash, display_name, email_verified) VALUES ($1,$2,$3,$4,$5,FALSE) RETURNING id, username, email, display_name, avatar_url, created_at",
      [randomUUID(), username.toLowerCase(), email.toLowerCase(), passwordHash, typeof displayName === "string" ? displayName.slice(0, 80) : username],
    );
    const user = result.rows[0];
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await client.query(
      "INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,NOW()+INTERVAL '30 minutes')",
      [randomUUID(), user.id, tokenHash],
    );

    const verificationUrl = new URL("/api/v1/auth/verify-email", publicApiUrl);
    verificationUrl.searchParams.set("token", rawToken);
    await emailTransport.sendMail({
      from: smtpFrom,
      to: user.email,
      subject: "Verify your Opexnal email",
      text: `Verify your Opexnal account within 30 minutes: ${verificationUrl.toString()}\nIf you did not request this account, ignore this message.`,
      html: `<p>Verify your Opexnal account within 30 minutes:</p><p><a href="${verificationUrl.toString()}">Verify email</a></p><p>If you did not request this account, ignore this message.</p>`,
    });
    await client.query("COMMIT");
    return res.status(201).json({
      user: publicUser(user),
      emailVerificationRequired: true,
      message: "Account created. Check your email to verify it before signing in.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Username or email is already registered." });
    }
    next(error);
  } finally {
    client.release();
  }
});

app.get("/api/v1/auth/verify-email", dbRequired, async (req, res, next) => {
  const rawToken = typeof req.query.token === "string" ? req.query.token : "";
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(rawToken)) {
    return res.status(400).json({ error: "Invalid or expired email verification link." });
  }
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tokenResult = await client.query(
      "SELECT id, user_id FROM email_verification_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE",
      [tokenHash],
    );
    if (!tokenResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid or expired email verification link." });
    }
    const token = tokenResult.rows[0];
    await client.query("UPDATE users SET email_verified=TRUE, updated_at=NOW() WHERE id=$1", [token.user_id]);
    await client.query("UPDATE email_verification_tokens SET used_at=NOW() WHERE id=$1", [token.id]);
    await client.query("COMMIT");
    return res.json({ success: true, message: "Email verified. You can now sign in to Opexnal." });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});
app.post("/api/v1/auth/password-reset/request", dbRequired, async (req, res, next) => {
  if (!emailTransport || !publicApiUrl) {
    return res.status(503).json({ error: "Password reset email delivery is not configured." });
  }
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!validEmail(email)) return res.status(400).json({ error: "A valid email address is required." });
  if (
    !rateLimit("password-reset:" + String(req.ip || "unknown"), 5) ||
    !rateLimit("password-reset-email:" + email, 3)
  ) {
    return res.status(429).json({ error: "Too many reset requests. Try again later." });
  }

  try {
    const result = await pool.query("SELECT id, email FROM users WHERE email=$1 LIMIT 1", [email]);
    const user = result.rows[0];
    // Do not reveal whether an account exists.
    if (!user) {
      return res.json({ success: true, message: "If an account exists for that email, reset instructions will be sent." });
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await pool.query(
      "UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL",
      [user.id],
    );
    await pool.query(
      "INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,NOW()+INTERVAL '30 minutes')",
      [randomUUID(), user.id, tokenHash],
    );
    const resetUrl = new URL("/auth/reset-password", publicApiUrl);
    resetUrl.searchParams.set("token", rawToken);
    try {
      await emailTransport.sendMail({
        from: smtpFrom,
        to: user.email,
        subject: "Reset your Opexnal password",
        text: `Use this secure link within 30 minutes to reset your Opexnal password: ${resetUrl.toString()}\nIf you did not request a reset, ignore this message.`,
        html: `<p>Use this secure link within 30 minutes to reset your Opexnal password:</p><p><a href="${resetUrl.toString()}">Reset password</a></p><p>If you did not request a reset, ignore this message.</p>`,
      });
    } catch {
      await pool.query(
        "UPDATE password_reset_tokens SET used_at=NOW() WHERE token_hash=$1 AND used_at IS NULL",
        [tokenHash],
      );
      return res.status(503).json({ error: "Reset email could not be delivered. Please try again later." });
    }
    return res.json({ success: true, message: "If an account exists for that email, reset instructions will be sent." });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/auth/password-reset/confirm", dbRequired, async (req, res, next) => {
  const rawToken = typeof req.body?.token === "string" ? req.body.token : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(rawToken)) {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }
  if (!validPassword(newPassword)) {
    return res.status(400).json({
      error: "Password must be 12–128 characters and include lowercase, uppercase, a number, and a symbol.",
    });
  }
  if (!rateLimit("password-reset-confirm:" + String(req.ip || "unknown"), 10)) {
    return res.status(429).json({ error: "Too many reset attempts. Try again later." });
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT id, user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",
      [tokenHash],
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }
    const reset = result.rows[0];
    const passwordHash = await hashPassword(newPassword);
    await client.query(
      "UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2",
      [passwordHash, reset.user_id],
    );
    await client.query("UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1", [reset.id]);
    await client.query(
      "UPDATE auth_sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL",
      [reset.user_id],
    );
    await client.query("UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL", [reset.user_id]);
    await client.query("COMMIT");
    return res.json({ success: true, message: "Password reset successfully. Sign in again with the new password." });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
});

app.post("/api/v1/auth/login", dbRequired, async (req, res, next) => {
  try {
    const { identity, password } = req.body || {};
    if (!rateLimit("login:" + String(req.ip || "unknown"), 10)) return res.status(429).json({ error: "Too many login attempts. Try again later." });
    if (typeof identity !== "string" || typeof password !== "string" || identity.length > 254 || password.length > 128) return res.status(400).json({ error: "Username/email and password are required." });
    if (!rateLimit("login-identity:" + identity.toLowerCase(), 10)) {
      return res.status(429).json({ error: "Too many login attempts for this account. Try again later." });
    }
    const result = await pool.query("SELECT id, username, email, password_hash, display_name, avatar_url, created_at, email_verified FROM users WHERE username = $1 OR email = $1 LIMIT 1", [identity.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid username/email or password." });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: "Please verify your email before signing in." });
    }
    return res.json({
      user: publicUser(user),
      accessToken: await issueToken(user, req),
      tokenType: "Bearer",
      expiresIn: 3600,
      emailVerified: true,
    });
  } catch (error) { next(error); }
});
app.get("/api/v1/auth/me", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = $1", [req.user.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Account not found." });
    return res.json({ user: publicUser(result.rows[0]) });
  } catch (error) { next(error); }
});
app.post("/api/v1/auth/logout", dbRequired, authRequired, async (req, res, next) => {
  try {
    await pool.query(
      "UPDATE auth_sessions SET revoked_at=NOW() WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL",
      [req.authSessionId, req.user.id],
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/auth/sessions", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, created_at, expires_at, revoked_at, user_agent, ip_address FROM auth_sessions WHERE user_id=$1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 50",
      [req.user.id],
    );
    return res.json({
      sessions: result.rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        revoked: Boolean(row.revoked_at),
        current: row.id === req.authSessionId,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/auth/sessions/:sessionId", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE auth_sessions SET revoked_at=NOW() WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id",
      [req.params.sessionId, req.user.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Active session not found." });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/auth/websocket-ticket", dbRequired, authRequired, async (req, res, next) => {
  try {
    const rawTicket = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawTicket).digest("hex");
    await pool.query(
      "INSERT INTO websocket_tickets (id,user_id,session_id,token_hash,expires_at) VALUES ($1,$2,$3,$4,NOW()+INTERVAL '30 seconds')",
      [randomUUID(), req.user.id, req.authSessionId, tokenHash],
    );
    return res.json({ ticket: rawTicket, expiresIn: 30 });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/auth/logout-all", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE auth_sessions SET revoked_at=NOW() WHERE user_id=$1 AND id<>$2 AND revoked_at IS NULL RETURNING id",
      [req.user.id, req.authSessionId],
    );
    return res.json({ success: true, revokedCount: result.rowCount || 0 });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/storage/upload", dbRequired, authRequired, mediaUpload.single("file"), async (req, res, next) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "A media file is required." });
  try {
    if (file.mimetype.startsWith("image/") && file.size > 20 * 1024 * 1024) {
      unlinkSync(file.path);
      return res.status(413).json({ error: "Images must be 20 MB or smaller." });
    }
    const detected = await fileTypeFromFile(file.path);
    if (!detected || detected.mime !== file.mimetype || !allowedMediaTypes.has(detected.mime)) {
      unlinkSync(file.path);
      return res.status(400).json({ error: "The uploaded file content does not match an allowed image/video type." });
    }
    const result = await pool.query(
      "INSERT INTO media_objects (id,owner_id,object_key,mime_type,size_bytes) VALUES ($1,$2,$3,$4,$5) RETURNING object_key",
      [randomUUID(), req.user.id, file.filename, detected.mime, file.size],
    );
    return res.status(201).json({ storagePath: `/api/v1/storage/${result.rows[0].object_key}` });
  } catch (error) {
    try { unlinkSync(file.path); } catch {}
    return next(error);
  }
});

app.post("/api/v1/storage/signed-url", dbRequired, authRequired, async (req, res, next) => {
  const rawPath = typeof req.body?.path === "string" ? req.body.path : "";
  const objectKey = rawPath.startsWith("/api/v1/storage/") ? rawPath.slice("/api/v1/storage/".length) : rawPath;
  if (!mediaKeyPattern.test(objectKey) || objectKey.includes("/")) {
    return res.status(400).json({ error: "Invalid media path." });
  }
  const expiresIn = Math.min(Math.max(Number(req.body?.expiresIn || 300), 60), 3600);
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  try {
    const result = await pool.query(
      `SELECT m.object_key,
        (m.owner_id=$2
          OR EXISTS (SELECT 1 FROM posts p JOIN users owner ON owner.id=p.user_id WHERE p.media_url=$3 AND (p.user_id=$2 OR (p.visibility='public' AND (owner.is_private=FALSE OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=p.user_id))) OR (p.visibility='followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=p.user_id))))
          OR EXISTS (SELECT 1 FROM stories s JOIN users owner ON owner.id=s.user_id WHERE s.media_url=$3 AND s.expires_at>NOW() AND (s.user_id=$2 OR (s.visibility='public' AND (owner.is_private=FALSE OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=s.user_id))) OR (s.visibility='followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=s.user_id)))) AS can_access
       FROM media_objects m WHERE m.object_key=$1 AND m.deleted_at IS NULL LIMIT 1`,
      [objectKey, req.user.id, `/api/v1/storage/${objectKey}`],
    );
    if (!result.rowCount || !result.rows[0].can_access) {
      return res.status(404).json({ error: "Media not found or access denied." });
    }
    const signature = signMediaUrl(objectKey, expires);
    return res.json({
      signedUrl: `/api/v1/storage/${objectKey}?expires=${expires}&signature=${signature}`,
      expiresIn,
    });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/storage/:objectKey", dbRequired, authRequired, async (req, res, next) => {
  const objectKey = req.params.objectKey;
  if (!mediaKeyPattern.test(objectKey)) return res.status(400).json({ error: "Invalid media path." });
  const storagePath = `/api/v1/storage/${objectKey}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const media = await client.query(
      "SELECT id, owner_id FROM media_objects WHERE object_key=$1 AND deleted_at IS NULL FOR UPDATE",
      [objectKey],
    );
    if (!media.rowCount || media.rows[0].owner_id !== req.user.id) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Media not found." });
    }
    const references = await client.query(
      `SELECT 1
       WHERE EXISTS (SELECT 1 FROM posts WHERE media_url=$1)
          OR EXISTS (SELECT 1 FROM post_media WHERE storage_path=$1)
          OR EXISTS (SELECT 1 FROM stories WHERE media_url=$1)
       LIMIT 1`,
      [storagePath],
    );
    if (references.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Media is still attached to a post or story." });
    }
    await client.query("UPDATE media_objects SET deleted_at=NOW() WHERE id=$1", [media.rows[0].id]);
    await client.query("COMMIT");
    try { unlinkSync(path.join(mediaRoot, objectKey)); } catch {}
    return res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
});

app.get("/api/v1/storage/public/:objectKey", dbRequired, async (req, res, next) => {
  const objectKey = req.params.objectKey;
  if (!mediaKeyPattern.test(objectKey)) return res.status(404).json({ error: "Media not found." });
  try {
    const result = await pool.query(
      `SELECT m.object_key,m.mime_type FROM media_objects m
       WHERE m.object_key=$1 AND m.deleted_at IS NULL
       AND (EXISTS (SELECT 1 FROM posts p JOIN users owner ON owner.id=p.user_id WHERE p.media_url=$2 AND p.visibility='public' AND owner.is_private=FALSE)
         OR EXISTS (SELECT 1 FROM stories s JOIN users owner ON owner.id=s.user_id WHERE s.media_url=$2 AND s.visibility='public' AND s.expires_at>NOW() AND owner.is_private=FALSE))
       LIMIT 1`,
      [objectKey, `/api/v1/storage/${objectKey}`],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Public media not found." });
    res.type(result.rows[0].mime_type);
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.sendFile(path.join(mediaRoot, result.rows[0].object_key), (error) => {
      if (error && !res.headersSent) res.status(404).json({ error: "Media file not found." });
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/storage/:objectKey", dbRequired, async (req, res, next) => {
  const objectKey = req.params.objectKey;
  const expires = Number(req.query.expires);
  const signature = typeof req.query.signature === "string" ? req.query.signature : "";
  if (
    !mediaKeyPattern.test(objectKey) ||
    !Number.isSafeInteger(expires) ||
    expires <= Math.floor(Date.now() / 1000) ||
    expires > Math.floor(Date.now() / 1000) + 3600 ||
    !/^[0-9a-f]{64}$/i.test(signature)
  ) {
    return res.status(403).json({ error: "Invalid or expired media signature." });
  }
  const expected = Buffer.from(signMediaUrl(objectKey, expires), "hex");
  const supplied = Buffer.from(signature, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return res.status(403).json({ error: "Invalid or expired media signature." });
  }
  try {
    const result = await pool.query(
      "SELECT mime_type FROM media_objects WHERE object_key=$1 AND deleted_at IS NULL LIMIT 1",
      [objectKey],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Media not found." });
    res.type(result.rows[0].mime_type);
    res.setHeader("Cache-Control", "private, max-age=60");
    return res.sendFile(path.join(mediaRoot, objectKey), (error) => {
      if (error && !res.headersSent) res.status(404).json({ error: "Media file not found." });
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/posts/feed", dbRequired, authRequired, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 50);
    const result = await pool.query(
      `SELECT
        p.id, p.user_id AS author_id, u.username, u.display_name, u.avatar_url,
        p.caption, p.media_url, p.media_type, p.visibility, p.location_name, p.comments_enabled, p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM post_likes l WHERE l.post_id=p.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id) AS comments_count,
        (SELECT COUNT(*) FROM post_saves s WHERE s.post_id=p.id) AS saves_count,
        (SELECT COUNT(*) FROM post_shares sh WHERE sh.post_id=p.id) AS shares_count,
        EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id=p.id AND l.user_id=$1) AS liked_by_me,
        EXISTS(SELECT 1 FROM post_saves s WHERE s.post_id=p.id AND s.user_id=$1) AS saved_by_me,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', pm.id, 'post_id', pm.post_id, 'user_id', pm.user_id,
            'storage_path', pm.storage_path, 'media_type', pm.media_type,
            'width', pm.width, 'height', pm.height, 'duration_seconds', pm.duration_seconds,
            'position', pm.position, 'created_at', pm.created_at
          ) ORDER BY pm.position) FROM post_media pm WHERE pm.post_id=p.id),
          CASE WHEN p.media_url IS NOT NULL THEN json_build_array(json_build_object(
            'id', p.id::text || '-media', 'post_id', p.id, 'user_id', p.user_id,
            'storage_path', p.media_url, 'media_type', p.media_type,
            'width', NULL, 'height', NULL, 'duration_seconds', NULL,
            'position', 0, 'created_at', p.created_at
          )) ELSE '[]'::json END
        ) AS media
      FROM posts p
      JOIN users u ON u.id=p.user_id
      WHERE (
          p.user_id=$1
          OR (p.visibility='public' AND (u.is_private=FALSE OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.following_id=p.user_id)))
          OR (p.visibility='followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.following_id=p.user_id))
        )
        AND ($3::timestamptz IS NULL OR p.created_at < $3::timestamptz)
      ORDER BY p.created_at DESC
      LIMIT $2`,
      [
        req.user.id,
        limit,
        typeof req.query.cursor === "string" && Number.isFinite(new Date(req.query.cursor).getTime())
          ? new Date(req.query.cursor).toISOString()
          : null,
      ],
    );
    res.json({ posts: result.rows });
  } catch (error) { next(error); }
});
app.get("/api/v1/posts/:postId", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        p.id, p.user_id AS author_id, u.username, u.display_name, u.avatar_url,
        p.caption, p.media_url, p.media_type, p.visibility, p.location_name, p.comments_enabled,
        p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM post_likes l WHERE l.post_id=p.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id) AS comments_count,
        (SELECT COUNT(*) FROM post_saves s WHERE s.post_id=p.id) AS saves_count,
        (SELECT COUNT(*) FROM post_shares sh WHERE sh.post_id=p.id) AS shares_count,
        EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id=p.id AND l.user_id=$2) AS liked_by_me,
        EXISTS(SELECT 1 FROM post_saves s WHERE s.post_id=p.id AND s.user_id=$2) AS saved_by_me,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', pm.id, 'post_id', pm.post_id, 'user_id', pm.user_id,
            'storage_path', pm.storage_path, 'media_type', pm.media_type,
            'width', pm.width, 'height', pm.height, 'duration_seconds', pm.duration_seconds,
            'position', pm.position, 'created_at', pm.created_at
          ) ORDER BY pm.position) FROM post_media pm WHERE pm.post_id=p.id),
          CASE WHEN p.media_url IS NOT NULL THEN json_build_array(json_build_object(
            'id', p.id::text || '-media', 'post_id', p.id, 'user_id', p.user_id,
            'storage_path', p.media_url, 'media_type', p.media_type,
            'width', NULL, 'height', NULL, 'duration_seconds', NULL,
            'position', 0, 'created_at', p.created_at
          )) ELSE '[]'::json END
        ) AS media
      FROM posts p JOIN users u ON u.id=p.user_id
      WHERE p.id=$1 AND (
        p.user_id=$2
        OR (p.visibility='public' AND (u.is_private=FALSE OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=p.user_id)))
        OR (p.visibility='followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=p.user_id))
      )
      LIMIT 1`,
      [req.params.postId, req.user.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Post not found." });
    return res.json({ post: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

const profileSelect = `
  SELECT u.id,u.username,u.display_name,u.bio,u.avatar_url,u.website,u.location,u.locale,u.timezone,
    u.country_code,u.is_private,u.is_deactivated,u.account_type,u.allow_mentions_from,u.allow_tags_from,
    u.show_activity_status,u.last_active_at,u.created_at,u.updated_at,
    (SELECT COUNT(*) FROM posts p WHERE p.user_id=u.id) AS posts_count,
    (SELECT COUNT(*) FROM follows f WHERE f.following_id=u.id) AS followers_count,
    (SELECT COUNT(*) FROM follows f WHERE f.follower_id=u.id) AS following_count
  FROM users u
`;

app.get("/api/v1/users/me", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(profileSelect + " WHERE u.id=$1 LIMIT 1", [req.user.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Profile not found." });
    await pool.query("UPDATE users SET last_active_at=NOW() WHERE id=$1", [req.user.id]);
    return res.json({ profile: publicProfile(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/users/id/:userId", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(profileSelect + " WHERE u.id=$1 LIMIT 1", [req.params.userId]);
    if (!result.rowCount || (result.rows[0].is_deactivated && result.rows[0].id !== req.user.id)) {
      return res.status(404).json({ error: "Profile not found." });
    }
    return res.json({ profile: publicProfile(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/users/search", dbRequired, authRequired, async (req, res, next) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 50) : "";
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 30);
  if (!rateLimit("user-search:" + req.user.id, 60)) {
    return res.status(429).json({ error: "Too many searches. Try again shortly." });
  }
  try {
    const result = query
      ? await pool.query(
          profileSelect + " WHERE u.is_deactivated=FALSE AND u.id<>$1 AND (u.username ILIKE $2 OR u.display_name ILIKE $2) ORDER BY followers_count DESC LIMIT $3",
          [req.user.id, `%${query.replace(/[\\%_]/g, "\\$&")}%`, limit],
        )
      : await pool.query(
          profileSelect + " WHERE u.is_deactivated=FALSE AND u.id<>$1 ORDER BY followers_count DESC, u.created_at DESC LIMIT $2",
          [req.user.id, limit],
        );
    return res.json({ profiles: result.rows.map(publicProfile) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/users/:username", dbRequired, authRequired, async (req, res, next) => {
  const username = String(req.params.username || "").toLowerCase();
  try {
    const result = await pool.query(profileSelect + " WHERE LOWER(u.username)=LOWER($1) LIMIT 1", [username]);
    if (!result.rowCount || (result.rows[0].is_deactivated && result.rows[0].id !== req.user.id)) {
      return res.status(404).json({ error: "Profile not found." });
    }
    return res.json({ profile: publicProfile(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/v1/users/me", dbRequired, authRequired, async (req, res, next) => {
  const body = req.body || {};
  const updates = [];
  const values = [];
  const add = (column, value) => {
    values.push(value);
    updates.push(`${column}=$${values.length}`);
  };

  if (body.username !== undefined) {
    if (!validUsername(body.username)) {
      return res.status(400).json({ error: "Username must be 3–30 characters using letters, numbers, dots, or underscores." });
    }
    const existing = await pool.query("SELECT 1 FROM users WHERE LOWER(username)=LOWER($1) AND id<>$2 LIMIT 1", [body.username, req.user.id]);
    if (existing.rowCount) return res.status(409).json({ error: "Username is already taken." });
    add("username", body.username.toLowerCase());
  }
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || !body.displayName.trim() || body.displayName.trim().length > 80) {
      return res.status(400).json({ error: "Display name must be 1–80 characters." });
    }
    add("display_name", body.displayName.trim());
  }
  if (body.bio !== undefined) {
    if (typeof body.bio !== "string" || body.bio.length > 500) return res.status(400).json({ error: "Bio must be 500 characters or fewer." });
    add("bio", body.bio);
  }
  if (body.website !== undefined) {
    if (body.website !== null && body.website !== "") {
      try {
        const url = new URL(body.website);
        if (url.protocol !== "https:") throw new Error("HTTPS required");
      } catch {
        return res.status(400).json({ error: "Website must be a valid HTTPS URL." });
      }
      add("website", body.website);
    } else {
      add("website", null);
    }
  }
  if (body.location !== undefined) {
    if (body.location !== null && (typeof body.location !== "string" || body.location.length > 120)) return res.status(400).json({ error: "Location must be 120 characters or fewer." });
    add("location", body.location || null);
  }
  if (body.isPrivate !== undefined) {
    if (typeof body.isPrivate !== "boolean") return res.status(400).json({ error: "isPrivate must be boolean." });
    add("is_private", body.isPrivate);
  }
  if (body.accountType !== undefined) {
    if (!["personal", "creator", "business"].includes(body.accountType)) return res.status(400).json({ error: "Invalid account type." });
    add("account_type", body.accountType);
  }
  for (const [inputKey, column] of [["allowMentionsFrom", "allow_mentions_from"], ["allowTagsFrom", "allow_tags_from"]]) {
    if (body[inputKey] !== undefined) {
      if (!["everyone", "followers", "none"].includes(body[inputKey])) return res.status(400).json({ error: "Invalid mention/tag permission." });
      add(column, body[inputKey]);
    }
  }
  if (body.showActivityStatus !== undefined) {
    if (typeof body.showActivityStatus !== "boolean") return res.status(400).json({ error: "showActivityStatus must be boolean." });
    add("show_activity_status", body.showActivityStatus);
  }
  if (body.locale !== undefined) {
    if (typeof body.locale !== "string" || body.locale.length > 12) return res.status(400).json({ error: "Invalid locale." });
    add("locale", body.locale);
  }
  if (body.timezone !== undefined) {
    if (typeof body.timezone !== "string" || body.timezone.length > 80) return res.status(400).json({ error: "Invalid timezone." });
    add("timezone", body.timezone);
  }
  if (body.countryCode !== undefined) {
    if (body.countryCode !== null && (typeof body.countryCode !== "string" || !/^[A-Za-z]{2}$/.test(body.countryCode))) return res.status(400).json({ error: "Country code must be a two-letter code." });
    add("country_code", body.countryCode ? body.countryCode.toUpperCase() : null);
  }
  if (body.avatarUrl !== undefined) {
    if (body.avatarUrl !== null && typeof body.avatarUrl !== "string") return res.status(400).json({ error: "Invalid avatar path." });
    if (body.avatarUrl) {
      const prefix = "/api/v1/storage/";
      if (!body.avatarUrl.startsWith(prefix)) return res.status(400).json({ error: "Avatar must be uploaded to Opexnal storage." });
      const objectKey = body.avatarUrl.slice(prefix.length);
      const owned = await pool.query("SELECT 1 FROM media_objects WHERE object_key=$1 AND owner_id=$2 AND deleted_at IS NULL LIMIT 1", [objectKey, req.user.id]);
      if (!owned.rowCount) return res.status(403).json({ error: "You can only use media you uploaded." });
    }
    add("avatar_url", body.avatarUrl || null);
  }

  if (updates.length === 0) return res.status(400).json({ error: "No supported profile fields were provided." });
  values.push(req.user.id);
  try {
    await pool.query(`UPDATE users SET ${updates.join(", ")}, updated_at=NOW() WHERE id=$${values.length}`, values);
    const result = await pool.query(profileSelect + " WHERE u.id=$1 LIMIT 1", [req.user.id]);
    return res.json({ profile: publicProfile(result.rows[0]) });
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ error: "Username is already taken." });
    return next(error);
  }
});

app.get("/api/v1/users/:username/posts", dbRequired, authRequired, async (req, res, next) => {
  const cursor = typeof req.query.cursor === "string" ? new Date(req.query.cursor) : null;
  if (cursor && !Number.isFinite(cursor.getTime())) return res.status(400).json({ error: "Invalid cursor." });
  const limit = Math.min(Math.max(Number(req.query.limit || 18), 1), 100);
  try {
    const result = await pool.query(
      `SELECT
        p.id, p.user_id AS author_id, u.username, u.display_name, u.avatar_url,
        p.caption, p.media_url, p.media_type, p.visibility, p.location_name, p.comments_enabled,
        p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM post_likes l WHERE l.post_id=p.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments c WHERE c.post_id=p.id) AS comments_count,
        (SELECT COUNT(*) FROM post_saves s WHERE s.post_id=p.id) AS saves_count,
        (SELECT COUNT(*) FROM post_shares sh WHERE sh.post_id=p.id) AS shares_count,
        EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id=p.id AND l.user_id=$2) AS liked_by_me,
        EXISTS(SELECT 1 FROM post_saves s WHERE s.post_id=p.id AND s.user_id=$2) AS saved_by_me,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', pm.id, 'post_id', pm.post_id, 'user_id', pm.user_id,
            'storage_path', pm.storage_path, 'media_type', pm.media_type,
            'width', pm.width, 'height', pm.height, 'duration_seconds', pm.duration_seconds,
            'position', pm.position, 'created_at', pm.created_at
          ) ORDER BY pm.position) FROM post_media pm WHERE pm.post_id=p.id),
          CASE WHEN p.media_url IS NOT NULL THEN json_build_array(json_build_object(
            'id', p.id::text || '-media', 'post_id', p.id, 'user_id', p.user_id,
            'storage_path', p.media_url, 'media_type', p.media_type,
            'width', NULL, 'height', NULL, 'duration_seconds', NULL,
            'position', 0, 'created_at', p.created_at
          )) ELSE '[]'::json END
        ) AS media
       FROM posts p JOIN users u ON u.id=p.user_id
       WHERE LOWER(u.username)=LOWER($1)
         AND (p.user_id=$2 OR (p.visibility='public' AND (u.is_private=FALSE OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=u.id)))
           OR (p.visibility='followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=u.id)))
         AND ($3::timestamptz IS NULL OR p.created_at < $3::timestamptz)
       ORDER BY p.created_at DESC LIMIT $4`,
      [String(req.params.username).toLowerCase(), req.user.id, cursor ? cursor.toISOString() : null, limit],
    );
    return res.json({ posts: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/users/:userId/following", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT following_id FROM follows WHERE follower_id=$1 ORDER BY created_at DESC LIMIT 5000",
      [req.user.id],
    );
    return res.json({ following: result.rows.map((row) => row.following_id) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/users/:userId/follow-status", dbRequired, authRequired, async (req, res, next) => {
  try {
    const target = await pool.query("SELECT id FROM users WHERE id=$1 LIMIT 1", [req.params.userId]);
    if (!target.rowCount) return res.status(404).json({ error: "User not found." });
    const [following, pending, followers, own] = await Promise.all([
      pool.query("SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2 LIMIT 1", [req.user.id, req.params.userId]),
      pool.query("SELECT 1 FROM follow_requests WHERE requester_id=$1 AND target_id=$2 AND status='pending' LIMIT 1", [req.user.id, req.params.userId]),
      pool.query("SELECT COUNT(*)::int AS count FROM follows WHERE following_id=$1", [req.params.userId]),
      pool.query("SELECT COUNT(*)::int AS count FROM follows WHERE follower_id=$1", [req.params.userId]),
    ]);
    return res.json({
      isFollowing: Boolean(following.rowCount),
      requestPending: Boolean(pending.rowCount),
      followersCount: followers.rows[0].count,
      followingCount: own.rows[0].count,
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/users/:userId/follow", dbRequired, authRequired, async (req, res, next) => {
  if (req.params.userId === req.user.id) return res.status(400).json({ error: "You cannot follow yourself." });
  try {
    const target = await pool.query("SELECT id,is_private,is_deactivated FROM users WHERE id=$1 LIMIT 1", [req.params.userId]);
    if (!target.rowCount || target.rows[0].is_deactivated) return res.status(404).json({ error: "User not found." });
    const alreadyFollowing = await pool.query(
      "SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2 LIMIT 1",
      [req.user.id, req.params.userId],
    );
    if (alreadyFollowing.rowCount) return res.json({ status: "following", following: true });
    if (target.rows[0].is_private) {
      await pool.query(
        "INSERT INTO follow_requests (id,requester_id,target_id,status) VALUES ($1,$2,$3,'pending') ON CONFLICT (requester_id,target_id) DO UPDATE SET status='pending',updated_at=NOW()",
        [randomUUID(), req.user.id, req.params.userId],
      );
      return res.json({ status: "requested", following: false });
    }
    await pool.query(
      "INSERT INTO follows (follower_id,following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [req.user.id, req.params.userId],
    );
    return res.json({ status: "following", following: true });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/users/:userId/follow", dbRequired, authRequired, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM follows WHERE follower_id=$1 AND following_id=$2", [req.user.id, req.params.userId]);
    return res.json({ following: false });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/follow-requests", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT fr.id,fr.requester_id,fr.created_at,u.username,u.display_name,u.avatar_url
       FROM follow_requests fr JOIN users u ON u.id=fr.requester_id
       WHERE fr.target_id=$1 AND fr.status='pending' ORDER BY fr.created_at DESC LIMIT 100`,
      [req.user.id],
    );
    return res.json({ requests: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/follow-requests/:requestId/accept", dbRequired, authRequired, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const request = await client.query(
      "SELECT id,requester_id,target_id FROM follow_requests WHERE id=$1 AND target_id=$2 AND status='pending' FOR UPDATE",
      [req.params.requestId, req.user.id],
    );
    if (!request.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pending follow request not found." });
    }
    const item = request.rows[0];
    await client.query(
      "INSERT INTO follows (follower_id,following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [item.requester_id, item.target_id],
    );
    await client.query("UPDATE follow_requests SET status='accepted',updated_at=NOW() WHERE id=$1", [item.id]);
    await client.query("COMMIT");
    return res.json({ accepted: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
});

app.post("/api/v1/follow-requests/:requestId/reject", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE follow_requests SET status='rejected',updated_at=NOW() WHERE id=$1 AND target_id=$2 AND status='pending' RETURNING id",
      [req.params.requestId, req.user.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Pending follow request not found." });
    return res.json({ rejected: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/posts", dbRequired, authRequired, async (req, res, next) => {
  const body = req.body || {};
  const caption = body.caption === undefined ? "" : body.caption;
  const visibility = body.visibility === undefined ? "public" : body.visibility;
  const commentsEnabled = body.commentsEnabled !== false;
  const locationName = typeof body.locationName === "string" ? body.locationName.trim().slice(0, 120) : null;
  let media = Array.isArray(body.media) ? body.media : [];
  if (!Array.isArray(body.media) && typeof body.mediaUrl === "string") {
    media = [{ mediaUrl: body.mediaUrl, mediaType: body.mediaType || "image" }];
  }
  if (
    typeof caption !== "string" ||
    caption.length > 2200 ||
    !["public", "followers", "private"].includes(visibility) ||
    media.length > 10
  ) {
    return res.status(400).json({ error: "Invalid post payload." });
  }
  if (
    media.some((item) =>
      !item ||
      typeof item.mediaUrl !== "string" ||
      item.mediaUrl.length > 2048 ||
      !["image", "video"].includes(item.mediaType) ||
      (item.width != null && (!Number.isInteger(item.width) || item.width < 1 || item.width > 30000)) ||
      (item.height != null && (!Number.isInteger(item.height) || item.height < 1 || item.height > 30000)) ||
      (item.durationSeconds != null && (typeof item.durationSeconds !== "number" || item.durationSeconds < 0 || item.durationSeconds > 3600))
    )
  ) {
    return res.status(400).json({ error: "One or more media items are invalid." });
  }
  if (media.length === 0 && caption.trim().length === 0) {
    return res.status(400).json({ error: "A post needs a caption or at least one media item." });
  }

  try {
    for (const item of media) {
      const prefix = "/api/v1/storage/";
      if (!item.mediaUrl.startsWith(prefix)) {
        return res.status(400).json({ error: "Post media must be uploaded to Opexnal storage first." });
      }
      const objectKey = item.mediaUrl.slice(prefix.length);
      const owned = await pool.query(
        "SELECT 1 FROM media_objects WHERE object_key=$1 AND owner_id=$2 AND deleted_at IS NULL LIMIT 1",
        [objectKey, req.user.id],
      );
      if (!owned.rowCount) {
        return res.status(403).json({ error: "You can only attach media you uploaded." });
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const first = media[0];
      const result = await client.query(
        "INSERT INTO posts (id,user_id,caption,media_url,media_type,visibility,location_name,comments_enabled) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
        [
          randomUUID(),
          req.user.id,
          caption,
          first?.mediaUrl || null,
          first?.mediaType || "text",
          visibility,
          locationName,
          commentsEnabled,
        ],
      );
      const post = result.rows[0];
      for (const [position, item] of media.entries()) {
        await client.query(
          "INSERT INTO post_media (id,post_id,user_id,storage_path,media_type,width,height,duration_seconds,position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            randomUUID(),
            post.id,
            req.user.id,
            item.mediaUrl,
            item.mediaType,
            item.width ?? null,
            item.height ?? null,
            item.durationSeconds ?? null,
            position,
          ],
        );
      }
      await client.query("COMMIT");
      return res.status(201).json({ post });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
});
async function findVisiblePost(postId, userId) {
  const result = await pool.query(
    "SELECT p.id,p.user_id,p.visibility,p.comments_enabled FROM posts p JOIN users owner ON owner.id=p.user_id WHERE p.id=$1 AND (p.user_id=$2 OR (p.visibility='public' AND (owner.is_private=FALSE OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=p.user_id))) OR (p.visibility='followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=p.user_id))) LIMIT 1",
    [postId, userId],
  );
  return result.rows[0] || null;
}

app.post("/api/v1/posts/:postId/like", dbRequired, authRequired, async (req, res, next) => {
  try {
    const post = await findVisiblePost(req.params.postId, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    await pool.query(
      "INSERT INTO post_likes (user_id,post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [req.user.id, post.id],
    );
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id=$1", [post.id]);
    return res.json({ liked: true, likeCount: count.rows[0].count });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/posts/:postId/like", dbRequired, authRequired, async (req, res, next) => {
  try {
    const post = await findVisiblePost(req.params.postId, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    await pool.query("DELETE FROM post_likes WHERE user_id=$1 AND post_id=$2", [req.user.id, post.id]);
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id=$1", [post.id]);
    return res.json({ liked: false, likeCount: count.rows[0].count });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/posts/:postId/save", dbRequired, authRequired, async (req, res, next) => {
  try {
    const post = await findVisiblePost(req.params.postId, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    await pool.query(
      "INSERT INTO post_saves (user_id,post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [req.user.id, post.id],
    );
    return res.json({ saved: true });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/posts/:postId/save", dbRequired, authRequired, async (req, res, next) => {
  try {
    const post = await findVisiblePost(req.params.postId, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    await pool.query("DELETE FROM post_saves WHERE user_id=$1 AND post_id=$2", [req.user.id, post.id]);
    return res.json({ saved: false });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/posts/:postId/share", dbRequired, authRequired, async (req, res, next) => {
  const channel = typeof req.body?.channel === "string" ? req.body.channel : "link";
  if (!["link", "story", "message", "other"].includes(channel)) {
    return res.status(400).json({ error: "Invalid share channel." });
  }
  try {
    const post = await findVisiblePost(req.params.postId, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    await pool.query(
      "INSERT INTO post_shares (id,user_id,post_id,channel) VALUES ($1,$2,$3,$4)",
      [randomUUID(), req.user.id, post.id, channel],
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/posts/:postId/comments", dbRequired, authRequired, async (req, res, next) => {
  try {
    const post = await findVisiblePost(req.params.postId, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    const result = await pool.query(
      `SELECT c.id,c.post_id,c.user_id,c.parent_id,c.body,c.likes_count,c.created_at,c.updated_at,
        u.username,u.display_name,u.avatar_url,
        EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id=c.id AND cl.user_id=$2) AS liked_by_me
       FROM post_comments c JOIN users u ON u.id=c.user_id
       WHERE c.post_id=$1 ORDER BY c.created_at ASC LIMIT 200`,
      [post.id, req.user.id],
    );
    return res.json({ comments: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/posts/:postId/comments", dbRequired, authRequired, async (req, res, next) => {
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  const parentId = typeof req.body?.parentId === "string" ? req.body.parentId : null;
  if (!body || body.length > 2000) return res.status(400).json({ error: "Comment must be 1–2000 characters." });
  try {
    const post = await findVisiblePost(req.params.postId, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    if (!post.comments_enabled) return res.status(403).json({ error: "Comments are disabled for this post." });
    if (parentId) {
      const parent = await pool.query(
        "SELECT id FROM post_comments WHERE id=$1 AND post_id=$2 LIMIT 1",
        [parentId, post.id],
      );
      if (!parent.rowCount) return res.status(400).json({ error: "Reply target is not part of this post." });
    }
    const id = randomUUID();
    const result = await pool.query(
      "INSERT INTO post_comments (id,post_id,user_id,parent_id,body) VALUES ($1,$2,$3,$4,$5) RETURNING id,post_id,user_id,parent_id,body,likes_count,created_at,updated_at",
      [id, post.id, req.user.id, parentId, body],
    );
    const author = await pool.query(
      "SELECT username,display_name,avatar_url FROM users WHERE id=$1",
      [req.user.id],
    );
    return res.status(201).json({
      comment: { ...result.rows[0], ...author.rows[0], liked_by_me: false },
    });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/comments/:commentId", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM post_comments c USING posts p
       WHERE c.id=$1 AND p.id=c.post_id AND (c.user_id=$2 OR p.user_id=$2)
       RETURNING c.id`,
      [req.params.commentId, req.user.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Comment not found or not owned by this account." });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/comments/:commentId/like", dbRequired, authRequired, async (req, res, next) => {
  try {
    const comment = await pool.query(
      "SELECT id FROM post_comments WHERE id=$1 LIMIT 1",
      [req.params.commentId],
    );
    if (!comment.rowCount) return res.status(404).json({ error: "Comment not found." });
    await pool.query(
      "INSERT INTO comment_likes (user_id,comment_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [req.user.id, req.params.commentId],
    );
    await pool.query(
      "UPDATE post_comments SET likes_count=(SELECT COUNT(*) FROM comment_likes WHERE comment_id=$1),updated_at=NOW() WHERE id=$1",
      [req.params.commentId],
    );
    return res.json({ liked: true });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/comments/:commentId/like", dbRequired, authRequired, async (req, res, next) => {
  try {
    const comment = await pool.query("SELECT id FROM post_comments WHERE id=$1 LIMIT 1", [req.params.commentId]);
    if (!comment.rowCount) return res.status(404).json({ error: "Comment not found." });
    await pool.query("DELETE FROM comment_likes WHERE user_id=$1 AND comment_id=$2", [req.user.id, req.params.commentId]);
    await pool.query(
      "UPDATE post_comments SET likes_count=(SELECT COUNT(*) FROM comment_likes WHERE comment_id=$1),updated_at=NOW() WHERE id=$1",
      [req.params.commentId],
    );
    return res.json({ liked: false });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/posts/:postId", dbRequired, authRequired, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const postResult = await client.query(
      "SELECT id,user_id FROM posts WHERE id=$1 FOR UPDATE",
      [req.params.postId],
    );
    if (!postResult.rowCount || postResult.rows[0].user_id !== req.user.id) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Post not found or not owned by this account." });
    }
    const media = await client.query(
      "SELECT storage_path FROM post_media WHERE post_id=$1 UNION SELECT media_url AS storage_path FROM posts WHERE id=$1 AND media_url IS NOT NULL",
      [req.params.postId],
    );
    await client.query("DELETE FROM posts WHERE id=$1 AND user_id=$2", [req.params.postId, req.user.id]);
    await client.query("COMMIT");
    for (const row of media.rows) {
      const key = typeof row.storage_path === "string" ? row.storage_path.replace("/api/v1/storage/", "") : "";
      if (!mediaKeyPattern.test(key)) continue;
      const references = await pool.query(
        "SELECT 1 WHERE EXISTS (SELECT 1 FROM posts WHERE media_url=$1) OR EXISTS (SELECT 1 FROM post_media WHERE storage_path=$1) OR EXISTS (SELECT 1 FROM stories WHERE media_url=$1) LIMIT 1",
        [row.storage_path],
      );
      if (!references.rowCount) {
        await pool.query("UPDATE media_objects SET deleted_at=NOW() WHERE object_key=$1 AND owner_id=$2", [key, req.user.id]);
        try { unlinkSync(path.join(mediaRoot, key)); } catch {}
      }
    }
    return res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
});

app.get("/api/v1/stories", dbRequired, authRequired, async (req, res, next) => {
  const targetUserId = typeof req.query.userId === "string" ? req.query.userId : null;
  try {
    const result = await pool.query(
      `SELECT s.id,s.user_id AS author_id,u.username,u.display_name,u.avatar_url,
        s.media_url,s.media_type,s.visibility,s.caption,s.width,s.height,s.created_at,s.expires_at
       FROM stories s JOIN users u ON u.id=s.user_id
       WHERE s.expires_at > NOW()
         AND ($2::uuid IS NULL OR s.user_id=$2)
         AND (
           s.user_id=$1
           OR (s.visibility='public' AND (u.is_private=FALSE OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.following_id=s.user_id)))
           OR (s.visibility='followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.following_id=s.user_id))
           OR (s.visibility='close_friends' AND EXISTS (SELECT 1 FROM close_friends cf WHERE cf.owner_id=s.user_id AND cf.friend_id=$1))
         )
       ORDER BY s.created_at ASC LIMIT 100`,
      [req.user.id, targetUserId],
    );
    return res.json({ stories: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/stories", dbRequired, authRequired, async (req, res, next) => {
  try {
    const {
      mediaUrl,
      mediaType = "image",
      visibility = "public",
      caption = "",
      width = null,
      height = null,
    } = req.body || {};
    if (
      typeof mediaUrl !== "string" ||
      mediaUrl.length > 2048 ||
      !["image", "video"].includes(mediaType) ||
      !["public", "followers", "close_friends", "private"].includes(visibility) ||
      typeof caption !== "string" ||
      caption.length > 500 ||
      (width !== null && (!Number.isInteger(width) || width < 1 || width > 30000)) ||
      (height !== null && (!Number.isInteger(height) || height < 1 || height > 30000))
    ) {
      return res.status(400).json({ error: "Invalid story payload." });
    }
    const prefix = "/api/v1/storage/";
    if (!mediaUrl.startsWith(prefix)) {
      return res.status(400).json({ error: "Story media must be uploaded to Opexnal storage first." });
    }
    const objectKey = mediaUrl.slice(prefix.length);
    const media = await pool.query(
      "SELECT 1 FROM media_objects WHERE object_key=$1 AND owner_id=$2 AND deleted_at IS NULL LIMIT 1",
      [objectKey, req.user.id],
    );
    if (!media.rowCount) return res.status(403).json({ error: "You can only attach media you uploaded." });
    const result = await pool.query(
      "INSERT INTO stories (id,user_id,media_url,media_type,visibility,caption,width,height,expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()+INTERVAL '24 hours') RETURNING *",
      [randomUUID(), req.user.id, mediaUrl, mediaType, visibility, caption.trim(), width, height],
    );
    return res.status(201).json({ story: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/stories/:storyId", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM stories WHERE id=$1 AND user_id=$2 RETURNING media_url",
      [req.params.storyId, req.user.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Story not found or not owned by this account." });
    const storagePath = result.rows[0].media_url;
    const objectKey = storagePath.replace("/api/v1/storage/", "");
    if (mediaKeyPattern.test(objectKey)) {
      const references = await pool.query(
        "SELECT 1 WHERE EXISTS (SELECT 1 FROM posts WHERE media_url=$1) OR EXISTS (SELECT 1 FROM post_media WHERE storage_path=$1) OR EXISTS (SELECT 1 FROM stories WHERE media_url=$1) LIMIT 1",
        [storagePath],
      );
      if (!references.rowCount) {
        await pool.query("UPDATE media_objects SET deleted_at=NOW() WHERE object_key=$1 AND owner_id=$2", [objectKey, req.user.id]);
        try { unlinkSync(path.join(mediaRoot, objectKey)); } catch {}
      }
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/stories/:storyId/view", dbRequired, authRequired, async (req, res, next) => {
  try {
    const story = await pool.query(
      `SELECT s.id,s.user_id,s.visibility,u.is_private
       FROM stories s JOIN users u ON u.id=s.user_id
       WHERE s.id=$1 AND s.expires_at>NOW()
         AND (s.user_id=$2
           OR (s.visibility='public' AND (u.is_private=FALSE OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=s.user_id)))
           OR (s.visibility='followers' AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.following_id=s.user_id))
           OR (s.visibility='close_friends' AND EXISTS (SELECT 1 FROM close_friends cf WHERE cf.owner_id=s.user_id AND cf.friend_id=$2)))
       LIMIT 1`,
      [req.params.storyId, req.user.id],
    );
    if (!story.rowCount) return res.status(404).json({ error: "Story not found or not visible to this account." });
    await pool.query(
      "INSERT INTO story_views (story_id,viewer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [req.params.storyId, req.user.id],
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/stories/:storyId/viewers", dbRequired, authRequired, async (req, res, next) => {
  try {
    const story = await pool.query("SELECT id FROM stories WHERE id=$1 AND user_id=$2 LIMIT 1", [req.params.storyId, req.user.id]);
    if (!story.rowCount) return res.status(404).json({ error: "Story not found or not owned by this account." });
    const result = await pool.query(
      `SELECT v.viewer_id,v.created_at,u.username,u.display_name,u.avatar_url
       FROM story_views v JOIN users u ON u.id=v.viewer_id
       WHERE v.story_id=$1 ORDER BY v.created_at DESC LIMIT 500`,
      [req.params.storyId],
    );
    return res.json({ viewers: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/users/:userId/story-muted", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT 1 FROM story_mutes WHERE muter_id=$1 AND muted_id=$2 LIMIT 1",
      [req.user.id, req.params.userId],
    );
    return res.json({ muted: Boolean(result.rowCount) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/v1/users/:userId/story-mute", dbRequired, authRequired, async (req, res, next) => {
  if (req.user.id === req.params.userId) return res.status(400).json({ error: "You cannot mute your own stories." });
  try {
    await pool.query("INSERT INTO story_mutes (muter_id,muted_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [req.user.id, req.params.userId]);
    return res.json({ muted: true });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/v1/users/:userId/story-mute", dbRequired, authRequired, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM story_mutes WHERE muter_id=$1 AND muted_id=$2", [req.user.id, req.params.userId]);
    return res.json({ muted: false });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/v1/reels", dbRequired, authRequired, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 50);
    const result = await pool.query("SELECT p.id,p.user_id AS author_id,u.username,u.avatar_url,p.caption,p.media_url,p.created_at FROM posts p JOIN users u ON u.id=p.user_id WHERE p.media_type='video' AND (p.visibility='public' OR p.user_id=$1) ORDER BY p.created_at DESC LIMIT $2", [req.user.id, limit]);
    res.json({ reels: result.rows });
  } catch (error) { next(error); }
});
app.get("/api/v1/messages/conversations", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query("SELECT c.id,c.created_at FROM conversations c JOIN conversation_members m ON m.conversation_id=c.id WHERE m.user_id=$1 ORDER BY c.created_at DESC LIMIT 100", [req.user.id]);
    res.json({ conversations: result.rows });
  } catch (error) { next(error); }
});
app.post("/api/v1/messages/conversations", dbRequired, authRequired, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { recipientId } = req.body || {};
    if (typeof recipientId !== "string" || recipientId === req.user.id) return res.status(400).json({ error: "A different recipientId is required." });
    await client.query("BEGIN");
    const recipient = await client.query("SELECT id FROM users WHERE id=$1", [recipientId]);
    if (!recipient.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Recipient not found." }); }
    const conversationId = randomUUID();
    await client.query("INSERT INTO conversations (id) VALUES ($1)", [conversationId]);
    await client.query("INSERT INTO conversation_members (conversation_id,user_id) VALUES ($1,$2),($1,$3)", [conversationId, req.user.id, recipientId]);
    await client.query("COMMIT");
    res.status(201).json({ conversation: { id: conversationId } });
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); next(error); }
  finally { client.release(); }
});
app.get("/api/v1/messages/:conversationId", dbRequired, authRequired, async (req, res, next) => {
  try {
    const member = await pool.query("SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2", [req.params.conversationId, req.user.id]);
    if (!member.rowCount) return res.status(404).json({ error: "Conversation not found." });
    const result = await pool.query("SELECT m.id,m.sender_id,m.body,m.created_at FROM messages m WHERE m.conversation_id=$1 ORDER BY m.created_at ASC LIMIT 200", [req.params.conversationId]);
    res.json({ messages: result.rows });
  } catch (error) { next(error); }
});
app.post("/api/v1/messages/:conversationId", dbRequired, authRequired, async (req, res, next) => {
  try {
    const body = req.body?.body;
    const conversationId = req.params.conversationId;
    if (typeof body !== "string" || !body.trim() || body.length > 5000) return res.status(400).json({ error: "Message must contain 1–5000 characters." });
    const member = await pool.query("SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2", [conversationId, req.user.id]);
    if (!member.rowCount) return res.status(404).json({ error: "Conversation not found." });
    const result = await pool.query("INSERT INTO messages (id,conversation_id,sender_id,body) VALUES ($1,$2,$3,$4) RETURNING id,conversation_id,sender_id,body,created_at", [randomUUID(), conversationId, req.user.id, body.trim()]);
    const message = result.rows[0];
    const members = await pool.query("SELECT user_id FROM conversation_members WHERE conversation_id=$1", [conversationId]);
    for (const row of members.rows) for (const socket of socketsByUser.get(row.user_id) || []) if (socket.readyState === 1) socket.send(JSON.stringify({ type: "message.created", message }));
    res.status(201).json({ message });
  } catch (error) { next(error); }
});

server.on("upgrade", (req, socket, head) => {
  void (async () => {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname !== "/ws" || !pool) throw new Error("Invalid WebSocket route.");
    const rawTicket = url.searchParams.get("ticket") || "";
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(rawTicket)) throw new Error("Invalid WebSocket ticket.");
    const tokenHash = createHash("sha256").update(rawTicket).digest("hex");
    const result = await pool.query(
      `WITH consumed_ticket AS (
        UPDATE websocket_tickets
        SET used_at=NOW()
        WHERE token_hash=$1 AND used_at IS NULL AND expires_at>NOW()
        RETURNING user_id, session_id
      )
      SELECT consumed_ticket.user_id
      FROM consumed_ticket
      JOIN auth_sessions ON auth_sessions.id=consumed_ticket.session_id
        AND auth_sessions.user_id=consumed_ticket.user_id
      WHERE auth_sessions.revoked_at IS NULL AND auth_sessions.expires_at>NOW()`,
      [tokenHash],
    );
    if (!result.rowCount) throw new Error("Invalid or expired WebSocket ticket.");
    const userId = result.rows[0].user_id;
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.userId = userId;
      wss.emit("connection", ws, req);
    });
  })().catch(() => {
    if (!socket.destroyed) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
    }
  });
});
wss.on("connection", (ws) => {
  const userSockets = socketsByUser.get(ws.userId) || new Set();
  userSockets.add(ws);
  socketsByUser.set(ws.userId, userSockets);
  ws.send(JSON.stringify({ type: "connected" }));
  ws.on("close", () => { userSockets.delete(ws); if (!userSockets.size) socketsByUser.delete(ws.userId); });
});
app.use((error, _req, res, _next) => {
  console.error("API request failed", error?.message || "unknown error");
  if (res.headersSent) return;
  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Uploaded file exceeds the allowed size." });
  }
  if (error?.code === "LIMIT_UNEXPECTED_FILE" || error?.message === "Unsupported media type.") {
    return res.status(415).json({ error: "Unsupported media type or upload field." });
  }
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body exceeds the allowed size." });
  }
  return res.status(500).json({ error: "Internal server error." });
});
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
server.listen(port, () => console.log("Opexnal API listening on :" + port));
async function shutdown() { server.close(); wss.close(); if (pool) await pool.end(); process.exit(0); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
