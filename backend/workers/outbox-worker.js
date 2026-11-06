import { randomUUID } from "node:crypto";
import pg from "pg";
import { notificationFromEvent } from "./notification-event.js";
import { boundedInteger, outboxWorkerSettings, workerIdentifier } from "../lib/outbox-config.js";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the outbox worker.");
}

const { poolMax, batchSize } = outboxWorkerSettings(process.env);
const pool = new Pool({
  connectionString: databaseUrl,
  max: poolMax,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  ...(process.env.DATABASE_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
});
const workerId = workerIdentifier(process.env.OUTBOX_WORKER_ID, `outbox-${randomUUID()}`);
const pollIntervalMs = boundedInteger(process.env.OUTBOX_POLL_INTERVAL_MS, 1000, 250, 30_000, "OUTBOX_POLL_INTERVAL_MS");
const maxAttempts = boundedInteger(process.env.OUTBOX_MAX_ATTEMPTS, 8, 1, 20, "OUTBOX_MAX_ATTEMPTS");
const leaseSeconds = boundedInteger(process.env.OUTBOX_LEASE_SECONDS, 300, 30, 3600, "OUTBOX_LEASE_SECONDS");

async function claimBatch() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `WITH due AS (
         SELECT id
         FROM event_outbox
         WHERE (status = 'pending' AND available_at <= NOW())
            OR (status = 'processing' AND locked_at < NOW() - ($3 * INTERVAL '1 second'))
         ORDER BY available_at, created_at
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       )
       UPDATE event_outbox AS event
       SET status = 'processing', locked_at = NOW(), locked_by = $2,
           attempts = attempts + 1, updated_at = NOW()
       FROM due
       WHERE event.id = due.id
       RETURNING event.id, event.event_type, event.event_version, event.payload, event.attempts`,
      [batchSize, workerId, leaseSeconds],
    );
    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function processEvent(event) {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    if (event.event_type === "notification.requested" && event.event_version === 1) {
      const notification = notificationFromEvent(event);
      if (notification) {
        await client.query(
          `INSERT INTO notifications
             (id, recipient_id, actor_id, notification_type, target_type, target_id, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
           ON CONFLICT (id) DO NOTHING`,
          [event.id, notification.recipientId, notification.actorId, notification.notificationType,
            notification.targetType, notification.targetId, JSON.stringify(notification.metadata)],
        );
      }
    } else {
      throw new Error("Unsupported outbox event type or version.");
    }
    const completed = await client.query(
      `UPDATE event_outbox
       SET status = 'published', published_at = NOW(), locked_at = NULL,
           locked_by = NULL, last_error_code = NULL, updated_at = NOW()
       WHERE id = $1 AND status = 'processing' AND locked_by = $2
       RETURNING id`,
      [event.id, workerId],
    );
    await client.query("COMMIT");
    if (completed.rowCount === 1) {
      console.info("Outbox event published", { eventId: event.id, eventType: event.event_type });
    } else {
      console.warn("Outbox event lease no longer owned at completion", {
        eventId: event.id,
        eventType: event.event_type,
      });
    }
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    const terminal = event.attempts >= maxAttempts;
    const delaySeconds = Math.min(300, 2 ** Math.min(event.attempts, 8));
    try {
      const scheduled = await pool.query(
        `UPDATE event_outbox
         SET status = $3, available_at = NOW() + ($4 * INTERVAL '1 second'),
             locked_at = NULL, locked_by = NULL,
             last_error_code = 'event_processing_failed', updated_at = NOW()
         WHERE id = $1 AND status = 'processing' AND locked_by = $2
         RETURNING id`,
        [event.id, workerId, terminal ? "dead" : "pending", delaySeconds],
      );
      if (scheduled.rowCount === 1) {
        console.error("Outbox event processing failed", {
          eventId: event.id,
          eventType: event.event_type,
          attempt: event.attempts,
          outcome: terminal ? "dead_lettered" : "retry_scheduled",
          error: error?.message || "unknown error",
        });
      }
    } catch (retryError) {
      // Leave the lease in place; another worker can reclaim it after lease expiry.
      console.error("Outbox retry scheduling failed", {
        eventId: event.id,
        error: retryError?.message || "unknown error",
      });
    }
  } finally {
    client?.release();
  }
}

async function run() {
  console.info("Outbox worker started", { workerId, batchSize, pollIntervalMs });
  let stopping = false;
  let consecutiveClaimFailures = 0;
  const stop = () => {
    stopping = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  try {
    while (!stopping) {
      let events;
      try {
        events = await claimBatch();
        consecutiveClaimFailures = 0;
      } catch (error) {
        consecutiveClaimFailures += 1;
        const retryDelayMs = Math.min(
          30_000,
          pollIntervalMs * 2 ** Math.min(consecutiveClaimFailures - 1, 5),
        );
        console.error("Outbox batch claim failed; retrying", {
          workerId,
          consecutiveFailures: consecutiveClaimFailures,
          retryDelayMs,
          error: error?.message || "unknown error",
        });
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      if (events.length) {
        await Promise.all(events.map((event) => processEvent(event)));
      } else {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }
  } finally {
    await pool.end();
    console.info("Outbox worker stopped", { workerId });
  }
}

run().catch(async (error) => {
  console.error("Outbox worker failed", error?.message || "unknown error");
  await pool.end();
  process.exitCode = 1;
});
