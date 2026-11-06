import "dotenv/config";
import pg from "pg";
import {
  deleteExpiredRateLimitBuckets,
  rateLimitCleanupBatchSize,
} from "../lib/rate-limit-cleanup.js";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl) throw new Error("DATABASE_URL is required for rate-limit cleanup.");
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  max: 1,
});
try {
  const batchSize = rateLimitCleanupBatchSize(process.env.RATE_LIMIT_CLEANUP_BATCH_SIZE);
  const deleted = await deleteExpiredRateLimitBuckets(pool, batchSize);
  console.log(JSON.stringify({ task: "rate_limit_cleanup", deleted, batchSize }));
} catch (error) {
  console.error("Rate-limit cleanup failed.", {
    code: typeof error?.code === "string" ? error.code : "RATE_LIMIT_CLEANUP_ERROR",
  });
  process.exitCode = 1;
} finally {
  await pool.end();
}
