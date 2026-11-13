export function rateLimitCleanupBatchSize(value = 5000) {
  const size = value === "" || value === undefined ? 5000 : Number(value);
  if (!Number.isSafeInteger(size) || size < 1 || size > 20_000) {
    throw new RangeError("RATE_LIMIT_CLEANUP_BATCH_SIZE must be an integer from 1 to 20000.");
  }
  return size;
}

export async function deleteExpiredRateLimitBuckets(pool, batchSize = 5000) {
  const size = rateLimitCleanupBatchSize(batchSize);
  if (!pool || typeof pool.query !== "function") {
    throw new TypeError("A PostgreSQL pool is required.");
  }
  const result = await pool.query(
    `WITH expired AS (
       SELECT bucket_hash FROM distributed_rate_limits
       WHERE expires_at < NOW()
       ORDER BY expires_at
       LIMIT $1
     )
     DELETE FROM distributed_rate_limits d
     USING expired e
     WHERE d.bucket_hash = e.bucket_hash
     RETURNING d.bucket_hash`,
    [size],
  );
  return result.rowCount;
}
