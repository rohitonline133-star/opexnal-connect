import assert from "node:assert/strict";
import test from "node:test";
import { summarizeOutboxHealth } from "../backend/lib/outbox-health.js";

const healthyRow = {
  pending_count: 2,
  processing_count: 1,
  dead_count: 0,
  oldest_pending_seconds: 30,
  stale_processing_count: 0,
  published_last_five_minutes: 7,
  dead_by_event_type: {},
};

test("reports healthy queue metrics within thresholds", () => {
  assert.deepEqual(summarizeOutboxHealth(healthyRow), {
    status: "healthy",
    pendingCount: 2,
    processingCount: 1,
    deadCount: 0,
    staleProcessingCount: 0,
    publishedLastFiveMinutes: 7,
    deadByEventType: {},
    oldestPendingSeconds: 30,
    alerts: [],
  });
});

test("reports each exceeded queue threshold", () => {
  const result = summarizeOutboxHealth({
    pending_count: 5,
    processing_count: 2,
    dead_count: 3,
    oldest_pending_seconds: 900,
    stale_processing_count: 2,
    published_last_five_minutes: 4,
    dead_by_event_type: { "notification.requested": 3 },
  });
  assert.equal(result.status, "degraded");
  assert.deepEqual(result.alerts, [
    "dead_events_above_threshold",
    "stale_processing_above_threshold",
    "oldest_pending_age_above_threshold",
  ]);
});

test("rejects malformed database metrics", () => {
  assert.throws(
    () => summarizeOutboxHealth({ ...healthyRow, pending_count: -1 }),
    /pendingCount must be a non-negative integer/,
  );
});


test("reports recent throughput and dead-letter event types", () => {
  const result = summarizeOutboxHealth({
    ...healthyRow,
    dead_count: 2,
    dead_by_event_type: { "notification.requested": 2 },
  });
  assert.equal(result.publishedLastFiveMinutes, 7);
  assert.deepEqual(result.deadByEventType, { "notification.requested": 2 });
});

test("rejects malformed dead-letter breakdown", () => {
  assert.throws(
    () => summarizeOutboxHealth({ ...healthyRow, dead_by_event_type: { broken: -1 } }),
    /non-negative integer count/,
  );
});
