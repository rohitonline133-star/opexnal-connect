import "dotenv/config";
import express from "express";
import http from "node:http";
import { createHash, randomUUID, scrypt as scryptCallback, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import pg from "pg";
import { WebSocketServer } from "ws";
import nodemailer from "nodemailer";

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
function authRequired(req, res, next) {
  if (!jwtSecret || jwtSecret.length < 32) return res.status(503).json({ error: "JWT_SECRET is not configured securely." });
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    const claims = jwt.verify(token, jwtSecret, { algorithms: ["HS256"], issuer: "opexnal-api", audience: "opexnal-app" });
    if (!claims || typeof claims !== "object" || typeof claims.sub !== "string") throw new Error("Invalid token");
    req.user = { id: claims.sub, username: typeof claims.username === "string" ? claims.username : "" };
    next();
  } catch { return res.status(401).json({ error: "Invalid or expired access token." }); }
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
function issueToken(user) {
  if (jwtSecret.length < 32) throw new Error("JWT_SECRET is not configured securely.");
  return jwt.sign({ username: user.username }, jwtSecret, { subject: user.id, expiresIn: "1h", issuer: "opexnal-api", audience: "opexnal-app", algorithm: "HS256" });
}
function publicUser(row) {
  return { id: row.id, username: row.username, email: row.email, displayName: row.display_name, avatarUrl: row.avatar_url, createdAt: row.created_at };
}
function validUsername(value) { return typeof value === "string" && /^[a-zA-Z0-9._]{3,30}$/.test(value); }
function validEmail(value) { return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validPassword(value) { return typeof value === "string" && value.length >= 12 && value.length <= 128; }

app.get("/health", async (_req, res) => {
  if (!pool) return res.status(503).json({ status: "not_ready", service: "opexnal-api", reason: "database_not_configured" });
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ok", service: "opexnal-api", database: "connected", websocket: true });
  } catch {
    return res.status(503).json({ status: "not_ready", service: "opexnal-api", reason: "database_unavailable" });
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
      error: "Use a 3–30 character username, valid email, and password of 12–128 characters.",
    });
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
app.post("/api/v1/auth/login", dbRequired, async (req, res, next) => {
  try {
    const { identity, password } = req.body || {};
    if (!rateLimit("login:" + String(req.ip || "unknown"), 10)) return res.status(429).json({ error: "Too many login attempts. Try again later." });
    if (typeof identity !== "string" || typeof password !== "string" || identity.length > 254 || password.length > 128) return res.status(400).json({ error: "Username/email and password are required." });
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
      accessToken: issueToken(user),
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
app.post("/api/v1/auth/logout", authRequired, (_req, res) => res.json({ success: true, message: "Access token cleared on client. Server-side revocation requires refresh-token sessions." }));

app.get("/api/v1/posts/feed", dbRequired, authRequired, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 50);
    const result = await pool.query("SELECT p.id, p.user_id AS author_id, u.username, u.display_name, u.avatar_url, p.caption, p.media_url, p.media_type, p.created_at, (SELECT COUNT(*) FROM post_likes l WHERE l.post_id=p.id) AS like_count, EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id=p.id AND l.user_id=$1) AS liked_by_me FROM posts p JOIN users u ON u.id=p.user_id WHERE p.visibility='public' OR p.user_id=$1 ORDER BY p.created_at DESC LIMIT $2", [req.user.id, limit]);
    res.json({ posts: result.rows });
  } catch (error) { next(error); }
});
app.post("/api/v1/posts", dbRequired, authRequired, async (req, res, next) => {
  try {
    const { caption = "", mediaUrl = null, mediaType = "image" } = req.body || {};
    if (typeof caption !== "string" || caption.length > 2200 || !["image", "video", "text"].includes(mediaType) || (mediaUrl !== null && (typeof mediaUrl !== "string" || mediaUrl.length > 2048))) return res.status(400).json({ error: "Invalid post payload." });
    if (mediaType !== "text" && !mediaUrl) return res.status(400).json({ error: "mediaUrl is required for image/video posts." });
    const result = await pool.query("INSERT INTO posts (id,user_id,caption,media_url,media_type) VALUES ($1,$2,$3,$4,$5) RETURNING *", [randomUUID(), req.user.id, caption, mediaUrl, mediaType]);
    res.status(201).json({ post: result.rows[0] });
  } catch (error) { next(error); }
});
app.get("/api/v1/stories", dbRequired, authRequired, async (req, res, next) => {
  try {
    const result = await pool.query("SELECT s.id,s.user_id AS author_id,u.username,u.avatar_url,s.media_url,s.media_type,s.created_at,s.expires_at FROM stories s JOIN users u ON u.id=s.user_id WHERE s.expires_at > NOW() AND (s.visibility='public' OR s.user_id=$1) ORDER BY s.created_at DESC LIMIT 100", [req.user.id]);
    res.json({ stories: result.rows });
  } catch (error) { next(error); }
});
app.post("/api/v1/stories", dbRequired, authRequired, async (req, res, next) => {
  try {
    const { mediaUrl, mediaType = "image" } = req.body || {};
    if (typeof mediaUrl !== "string" || mediaUrl.length > 2048 || !["image", "video"].includes(mediaType)) return res.status(400).json({ error: "Valid mediaUrl and image/video mediaType are required." });
    const result = await pool.query("INSERT INTO stories (id,user_id,media_url,media_type,expires_at) VALUES ($1,$2,$3,$4,NOW()+INTERVAL '24 hours') RETURNING *", [randomUUID(), req.user.id, mediaUrl, mediaType]);
    res.status(201).json({ story: result.rows[0] });
  } catch (error) { next(error); }
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
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname !== "/ws" || jwtSecret.length < 32) { socket.destroy(); return; }
  const token = url.searchParams.get("token") || "";
  try {
    const claims = jwt.verify(token, jwtSecret, { algorithms: ["HS256"], issuer: "opexnal-api", audience: "opexnal-app" });
    if (!claims || typeof claims !== "object" || typeof claims.sub !== "string") throw new Error("Invalid token");
    wss.handleUpgrade(req, socket, head, (ws) => { ws.userId = claims.sub; wss.emit("connection", ws, req); });
  } catch { socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n"); socket.destroy(); }
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
  if (!res.headersSent) res.status(500).json({ error: "Internal server error." });
});
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
server.listen(port, () => console.log("Opexnal API listening on :" + port));
async function shutdown() { server.close(); wss.close(); if (pool) await pool.end(); process.exit(0); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
