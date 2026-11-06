import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteExpiredRateLimitBuckets,
  rateLimitCleanupBatchSize,
} from "../backend/lib/rate-limit-cleanup.js";

test("validates cleanup batch bounds", () => {
  assert.equal(rateLimitCleanupBatchSize(), 5000);
  assert.equal(rateLimitCleanupBatchSize("250"), 250);
  assert.throws(() => rateLimitCleanupBatchSize(0), /must be an integer/);
  assert.throws(() => rateLimitCleanupBatchSize(20_001), /must be an integer/);
});

test("deletes only one bounded batch of expired buckets", async () => {
  let query;
  const pool = {
    query: async (...args) => {
      query = args;
      return { rowCount: 17 };
    },
  };
  assert.equal(await deleteExpiredRateLimitBuckets(pool, 250), 17);
  assert.match(query[0], /WHERE expires_at < NOW\(\)/);
  assert.match(query[0], /LIMIT \$1/);
  assert.equal(query[1][0], 250);
});

test("requires a PostgreSQL pool", async () => {
  await assert.rejects(deleteExpiredRateLimitBuckets(null), /PostgreSQL pool is required/);
});
