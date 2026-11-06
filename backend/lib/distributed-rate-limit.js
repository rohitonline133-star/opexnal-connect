import { createHmac } from "node:crypto";

const MIN_WINDOW_MS = 1_000;
const MAX_WINDOW_MS = 24 * 60 * 60 * 1_000;
const MAX_LIMIT = 100_000;

export function validateRateLimitOptions(max, windowMs) {
  if (!Number.isSafeInteger(max) || max < 1 || max > MAX_LIMIT) {
    throw new RangeError("Rate limit max must be an integer from 1 to 100000.");
  }
  if (!Number.isSafeInteger(windowMs) || windowMs < MIN_WINDOW_MS || windowMs > MAX_WINDOW_MS) {
    throw new RangeError("Rate limit window must be an integer from 1000 to 86400000 ms.");
  }
}

export function rateLimitBucketHash(secret, key, windowStartMs, windowMs) {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("A strong rate-limit HMAC secret is required.");
  }
  if (typeof key !== "string" || !key || key.length > 512) {
    throw new TypeError("Rate limit key must be a non-empty string up to 512 characters.");
  }
  return createHmac("sha256", secret)
    .update(`${windowMs}:${windowStartMs}:${key}`)
    .digest("hex");
}

// Atomic fixed-window counter shared by all API instances through PostgreSQL.
// The caller must use a transaction-capable pool; raw keys are never persisted.
export async function consumeDistributedRateLimit(pool, secret, key, max = 10, windowMs = 60_000, now = Date.now()) {
  validateRateLimitOptions(max, windowMs);
  if (!pool || typeof pool.query !== "function") throw new TypeError("A PostgreSQL pool is required.");
  if (!Number.isSafeInteger(now) || now < 0) throw new RangeError("Rate limit clock must be a non-negative integer.");
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const bucketHash = rateLimitBucketHash(secret, key, windowStartMs, windowMs);
  const result = await pool.query(
    `INSERT INTO distributed_rate_limits (bucket_hash, window_started_at, request_count, expires_at)
     VALUES ($1, to_timestamp($2 / 1000.0), 1, to_timestamp(($2 + $3) / 1000.0))
     ON CONFLICT (bucket_hash) DO UPDATE
       SET request_count = distributed_rate_limits.request_count + 1
     RETURNING request_count`,
    [bucketHash, windowStartMs, windowMs],
  );
  const count = Number(result.rows[0]?.request_count);
  if (!Number.isSafeInteger(count) || count < 1) throw new Error("Invalid distributed rate-limit counter response.");
  return { allowed: count <= max, remaining: Math.max(0, max - count), resetAt: windowStartMs + windowMs };
}
