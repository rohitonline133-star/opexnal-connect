import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeDistributedRateLimit,
  rateLimitBucketHash,
  validateRateLimitOptions,
} from "../backend/lib/distributed-rate-limit.js";

test("validates fixed-window bounds", () => {
  assert.doesNotThrow(() => validateRateLimitOptions(10, 60_000));
  assert.throws(() => validateRateLimitOptions(0, 60_000), /max must be/);
  assert.throws(() => validateRateLimitOptions(10, 999), /window must be/);
});

test("HMAC bucket hashes are stable but hide raw keys", () => {
  const hash = rateLimitBucketHash("s".repeat(32), "login:192.0.2.1", 60_000, 60_000);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hash, rateLimitBucketHash("s".repeat(32), "login:192.0.2.1", 60_000, 60_000));
  assert.notEqual(hash, rateLimitBucketHash("s".repeat(32), "login:192.0.2.2", 60_000, 60_000));
  assert.throws(() => rateLimitBucketHash("short", "key", 0, 1000), /strong rate-limit HMAC secret/);
});

test("uses one atomic PostgreSQL upsert and returns remaining quota", async () => {
  let call;
  const pool = { query: async (...args) => {
    call = args;
    return { rows: [{ request_count: "3" }] };
  }};
  const result = await consumeDistributedRateLimit(pool, "s".repeat(32), "signup:203.0.113.5", 3, 60_000, 125_000);
  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 0);
  assert.equal(result.resetAt, 180_000);
  assert.match(call[0], /ON CONFLICT \(bucket_hash\) DO UPDATE/);
  assert.equal(call[1][1], 120_000);
});

test("rejects malformed database counter responses", async () => {
  const pool = { query: async () => ({ rows: [{ request_count: "NaN" }] }) };
  await assert.rejects(
    consumeDistributedRateLimit(pool, "s".repeat(32), "login:test", 3, 60_000, 0),
    /Invalid distributed rate-limit counter/,
  );
});
