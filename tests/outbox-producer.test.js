import assert from "node:assert/strict";
import test from "node:test";
import { enqueueOutboxEvent } from "../backend/lib/outbox.js";

const event = {
  eventType: "notification.requested",
  aggregateType: "post",
  aggregateId: "123e4567-e89b-42d3-a456-426614174000",
  idempotencyKey: "post:123e4567-e89b-42d3-a456-426614174000:notification:v1",
  payload: { notificationType: "post.like" },
};

test("inserts an outbox event through the caller transaction client", async () => {
  let queryArgs;
  const client = {
    async query(sql, args) {
      queryArgs = { sql, args };
      return { rows: [{ id: "123e4567-e89b-42d3-a456-426614174099" }] };
    },
  };
  const id = await enqueueOutboxEvent(client, event);
  assert.equal(id, "123e4567-e89b-42d3-a456-426614174099");
  assert.match(queryArgs.sql, /ON CONFLICT \(idempotency_key\) DO NOTHING/);
  assert.equal(queryArgs.args[0], event.eventType);
});

test("returns null when an idempotency key has already been used", async () => {
  const client = { async query() { return { rows: [] }; } };
  assert.equal(await enqueueOutboxEvent(client, event), null);
});

test("rejects invalid event identity before issuing SQL", async () => {
  let called = false;
  const client = { async query() { called = true; return { rows: [] }; } };
  await assert.rejects(
    enqueueOutboxEvent(client, { ...event, aggregateId: "not-a-uuid" }),
    /aggregateId must be a UUID/,
  );
  assert.equal(called, false);
});

test("rejects array payloads", async () => {
  const client = { async query() { return { rows: [] }; } };
  await assert.rejects(
    enqueueOutboxEvent(client, { ...event, payload: [] }),
    /payload must be a JSON object/,
  );
});
