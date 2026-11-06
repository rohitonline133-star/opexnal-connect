import { randomUUID } from "node:crypto";
import pg from "pg";
import { notificationFromEvent } from "./notification-event.js";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the outbox worker.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.OUTBOX_DB_POOL_MAX || 3),
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
});
const workerId = process.env.OUTBOX_WORKER_ID || `outbox-${randomUUID()}`;
const batchSize = Math.min(Math.max(Number(process.env.OUTBOX_BATCH_SIZE || 20), 1), 100);
const pollIntervalMs = Math.min(Math.max(Number(process.env.OUTBOX_POLL_INTERVAL_MS || 1000), 250), 30_000);
const maxAttempts = Math.min(Math.max(Number(process.env.OUTBOX_MAX_ATTEMPTS || 8), 1), 20);

async function claimBatch() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `WITH due AS (
         SELECT id
         FROM event_outbox
         WHERE (status = 'pending' AND available_at <= NOW())
            OR (status = 'processing' AND locked_at < NOW() - INTERVAL '5 minutes')
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
      [batchSize, workerId],
    );
    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function processEvent(event) {
  const client = await pool.connect();
  try {
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
    await client.query(
      `UPDATE event_outbox
       SET status = 'published', published_at = NOW(), locked_at = NULL,
           locked_by = NULL, last_error_code = NULL, updated_at = NOW()
       WHERE id = $1 AND status = 'processing' AND locked_by = $2`,
      [event.id, workerId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    const terminal = event.attempts >= maxAttempts;
    const delaySeconds = Math.min(300, 2 ** Math.min(event.attempts, 8));
    try {
      await pool.query(
        `UPDATE event_outbox
         SET status = $3, available_at = NOW() + ($4 * INTERVAL '1 second'),
             locked_at = NULL, locked_by = NULL,
             last_error_code = 'event_processing_failed', updated_at = NOW()
         WHERE id = $1 AND status = 'processing' AND locked_by = $2`,
        [event.id, workerId, terminal ? "dead" : "pending", delaySeconds],
      );
    } catch (retryError) {
      // Leave the lease in place; another worker can reclaim it after lease expiry.
      console.error("Outbox retry scheduling failed", {
        eventId: event.id,
        error: retryError?.message || "unknown error",
      });
    }
  } finally {
    client.release();
  }
}

async function run() {
  console.info("Outbox worker started", { workerId, batchSize, pollIntervalMs });
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  try {
    while (!stopping) {
      const events = await claimBatch();
      if (events.length) {
        for (const event of events) await processEvent(event);
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
