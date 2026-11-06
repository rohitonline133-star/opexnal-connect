const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Insert an event using the caller's transaction client.
 * Call this before COMMIT on the same client as the authoritative business write.
 * Returns the new event id, or null when the idempotency key already exists.
 */
export async function enqueueOutboxEvent(client, event) {
  if (!client || typeof client.query !== "function") {
    throw new TypeError("A PostgreSQL transaction client is required.");
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new TypeError("An outbox event object is required.");
  }
  const {
    eventType,
    eventVersion = 1,
    aggregateType,
    aggregateId,
    idempotencyKey,
    payload = {},
  } = event;
  if (typeof eventType !== "string" || !/^[a-z][a-z0-9_.-]{1,119}$/i.test(eventType)) {
    throw new TypeError("eventType is invalid.");
  }
  if (!Number.isInteger(eventVersion) || eventVersion < 1 || eventVersion > 32767) {
    throw new TypeError("eventVersion must be a positive small integer.");
  }
  if (typeof aggregateType !== "string" || !/^[a-z][a-z0-9_.-]{1,79}$/i.test(aggregateType)) {
    throw new TypeError("aggregateType is invalid.");
  }
  if (typeof aggregateId !== "string" || !UUID_PATTERN.test(aggregateId)) {
    throw new TypeError("aggregateId must be a UUID.");
  }
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 1 || idempotencyKey.length > 180) {
    throw new TypeError("idempotencyKey must contain 1 to 180 characters.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("payload must be a JSON object.");
  }
  const result = await client.query(
    `INSERT INTO event_outbox
       (event_type, event_version, aggregate_type, aggregate_id, idempotency_key, payload)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [eventType, eventVersion, aggregateType, aggregateId, idempotencyKey, JSON.stringify(payload)],
  );
  return result.rows[0]?.id ?? null;
}
