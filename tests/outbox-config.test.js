import assert from "node:assert/strict";
import test from "node:test";
import { boundedInteger, outboxWorkerSettings, workerIdentifier } from "../backend/lib/outbox-config.js";

test("uses defaults and accepts values within configured bounds", () => {
  assert.equal(boundedInteger(undefined, 20, 1, 100, "OUTBOX_BATCH_SIZE"), 20);
  assert.equal(boundedInteger("50", 20, 1, 100, "OUTBOX_BATCH_SIZE"), 50);
});

test("rejects malformed and out-of-range worker settings", () => {
  for (const value of ["abc", "1.5", "0", "101"]) {
    assert.throws(() => boundedInteger(value, 20, 1, 100, "OUTBOX_BATCH_SIZE"), /OUTBOX_BATCH_SIZE must be an integer/);
  }
});

test("uses a fallback worker ID and validates explicit IDs", () => {
  assert.equal(workerIdentifier("", "outbox-default"), "outbox-default");
  assert.equal(workerIdentifier("worker-01", "unused"), "worker-01");
  assert.throws(() => workerIdentifier("bad worker", "unused"), /OUTBOX_WORKER_ID/);
  assert.throws(() => workerIdentifier("x".repeat(121), "unused"), /OUTBOX_WORKER_ID/);
});

test("keeps claimed batch size within the worker database pool", () => {
  assert.deepEqual(outboxWorkerSettings({}), { poolMax: 3, batchSize: 3 });
  assert.deepEqual(
    outboxWorkerSettings({ OUTBOX_DB_POOL_MAX: "8", OUTBOX_BATCH_SIZE: "5" }),
    { poolMax: 8, batchSize: 5 },
  );
  assert.throws(
    () => outboxWorkerSettings({ OUTBOX_DB_POOL_MAX: "2", OUTBOX_BATCH_SIZE: "3" }),
    /cannot exceed OUTBOX_DB_POOL_MAX/,
  );
  assert.throws(
    () => outboxWorkerSettings({ OUTBOX_BATCH_SIZE: "21" }),
    /OUTBOX_BATCH_SIZE must be an integer/,
  );
});
