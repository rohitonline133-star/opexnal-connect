import assert from "node:assert/strict";
import test from "node:test";
import { boundedInteger, workerIdentifier } from "../backend/lib/outbox-config.js";

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
