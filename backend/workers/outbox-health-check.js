import pg from "pg";
import { summarizeOutboxHealth } from "../lib/outbox-health.js";
import { boundedInteger } from "../lib/outbox-config.js";

const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required for the outbox health check.");
  process.exit(2);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 5000,
  ...(process.env.DATABASE_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
});
const maxPendingAgeSeconds = boundedInteger(
  process.env.OUTBOX_HEALTH_MAX_PENDING_AGE_SECONDS,
  300,
  0,
  86_400,
  "OUTBOX_HEALTH_MAX_PENDING_AGE_SECONDS",
);
const maxStaleProcessing = boundedInteger(
  process.env.OUTBOX_HEALTH_MAX_STALE_PROCESSING,
  0,
  0,
  1_000_000,
  "OUTBOX_HEALTH_MAX_STALE_PROCESSING",
);
const maxDeadEvents = boundedInteger(
  process.env.OUTBOX_HEALTH_MAX_DEAD_EVENTS,
  0,
  0,
  1_000_000,
  "OUTBOX_HEALTH_MAX_DEAD_EVENTS",
);

try {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status='pending')::int AS pending_count,
       COUNT(*) FILTER (WHERE status='processing')::int AS processing_count,
       COUNT(*) FILTER (WHERE status='dead')::int AS dead_count,
       COALESCE(
         EXTRACT(EPOCH FROM NOW() - MIN(created_at) FILTER (WHERE status='pending')),
         0
       )::int AS oldest_pending_seconds,
       COUNT(*) FILTER (
         WHERE status='processing'
           AND locked_at < NOW() - make_interval(secs => $1::int)
       )::int AS stale_processing_count
     FROM event_outbox`,
    [
      boundedInteger(
        process.env.OUTBOX_LEASE_SECONDS,
        300,
        30,
        3600,
        "OUTBOX_LEASE_SECONDS",
      ),
    ],
  );
  const health = summarizeOutboxHealth(result.rows[0], {
    maxPendingAgeSeconds,
    maxStaleProcessing,
    maxDeadEvents,
  });
  console.log(JSON.stringify({ component: "outbox", checkedAt: new Date().toISOString(), ...health }));
  if (health.status !== "healthy") process.exitCode = 1;
} catch (error) {
  console.error("Outbox health check failed", error?.message || "unknown error");
  process.exitCode = 2;
} finally {
  await pool.end();
}
